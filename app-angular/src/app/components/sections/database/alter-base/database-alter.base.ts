import { OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  Validators,
  AbstractControl,
  FormGroup
} from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { takeWhile, switchMap, catchError } from 'rxjs/operators';
import { DatabaseInstance, DatabaseSetOptions } from 'firebase-tools';

import {
  FirebaseToolsService,
  Workspace
} from '../../../../providers/firebase-tools.service';
import { ElectronService } from '../../../../providers/electron.service';
import { AppState } from '../../../../models';
import {
  contains,
  ansiToHTML,
  databasePathValidator
} from '../../../../../utils';

function jsonDataValidator(
  control: AbstractControl
): { [key: string]: any } | null {
  try {
    JSON.parse(control.value);
    return null;
  } catch (err) {
    return { data: err };
  }
}

export enum OperationType {
  Set = 'set',
  Update = 'update',
  Push = 'push',
  Remove = 'remove'
}

export abstract class DatabaseAlterBase implements OnInit, OnDestroy {
  public abstract operation: OperationType;
  public abstract info: string;

  public workspace: Workspace;
  public running = false;
  public showSuccess = false;
  public showError: SafeHtml | null = null;
  public instances: DatabaseInstance[] | null = null;
  public confirmModalVisible = false;
  public form: FormGroup;

  public workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  private destroy = false;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private store: Store<AppState>,
    private fb: FirebaseToolsService,
    private sanitizer: DomSanitizer,
    private electron: ElectronService
  ) {}

  ngOnInit() {
    let formControls: { [key: string]: any } = {
      path: [
        null,
        Validators.compose([Validators.required, databasePathValidator])
      ],
      instance: [null]
    };

    if (this.operation !== 'remove') {
      formControls = {
        ...formControls,
        dataOrigin: ['file', Validators.required],
        infile: [null, Validators.required],
        data: [null]
      };
    }

    this.form = this.formBuilder.group(formControls);

    if (this.operation !== 'remove') {
      this.setValidators();
    }

    this.workspace$.subscribe((workspace: Workspace) => {
      this.workspace = workspace;
      this.changeDetRef.markForCheck();
    });

    this.workspace$
      .pipe(
        switchMap(
          (workspace): Observable<DatabaseInstance[]> => {
            if (workspace) {
              return this.fb.getDatabaseInstances(workspace);
            } else {
              return of([]);
            }
          }
        ),
        catchError(() => of([]))
      )
      .subscribe(instances => {
        if (instances && instances.length >= 2) {
          this.instances = instances;
          const defaultInstance = instances.find(
            instance => instance.type === 'DEFAULT_REALTIME_DATABASE'
          );
          this.form
            .get('instance')
            .setValue(defaultInstance ? defaultInstance.instance : null);
        } else {
          this.instances = null;
          this.form.get('instance').setValue(null);
        }
        this.changeDetRef.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  get operationAction(): string {
    switch (this.operation) {
      case 'set':
        return 'stored';
      case 'update':
        return 'updated';
      case 'push':
        return 'pushed';
      case 'remove':
        return 'removed';
    }
  }

  get path(): string {
    return this.form.get('path').value;
  }

  get selectedFile(): string {
    return this.form.get('infile').value;
  }

  get dataOrigin(): string {
    return this.form.get('dataOrigin').value;
  }

  get selectedFileBasename(): string | void {
    const file = this.selectedFile;
    if (file) {
      return this.electron.path.basename(file);
    }
  }

  openFileDialog() {
    this.electron.dialog.showOpenDialog(
      {
        title: `Choose the file containing the database data to ${
          this.operation
        }`,
        defaultPath: this.workspace.path,
        filters: [
          {
            name: 'JSON file',
            extensions: ['json']
          }
        ]
      },
      (paths: string[]) => {
        this.form
          .get('infile')
          .setValue(paths && paths.length > 0 ? paths[0] : null);
        this.changeDetRef.markForCheck();
      }
    );
  }

  async start(): Promise<void> {
    this.confirmModalVisible = false;
    this.running = true;
    this.showSuccess = false;
    this.showError = null;

    let { dataOrigin, data, infile, path, instance } = this.form.value;

    if (dataOrigin === 'file') {
      data = undefined;
    } else {
      infile = undefined;
    }

    // We type is as if it were for "set" since it covers all cases
    const options: DatabaseSetOptions = {
      cwd: this.workspace.path,
      project: this.workspace.projectId,
      interactive: true,
      instance,
      data,
      confirm: true
    };

    try {
      if (this.operation === 'set') {
        await this.fb.tools.database.set(path, infile, options);
      } else if (this.operation === 'update') {
        await this.fb.tools.database.update(path, infile, options);
      } else if (this.operation === 'push') {
        await this.fb.tools.database.push(path, infile, options);
      } else if (this.operation === 'remove') {
        await this.fb.tools.database.remove(path, options);
      } else {
        throw new Error(`Unknown database operation "${this.operation}".`);
      }
      this.showSuccess = true;
    } catch (err) {
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
      console.log(`Database ${this.operation} error`, err);
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }

  openConsoleData(event: Event): boolean {
    event.preventDefault();
    event.stopPropagation();

    const urlBase = 'https://console.firebase.google.com/project';
    const projectId = this.workspace.projectId;
    const instance = this.instances
      ? this.form.get('instance').value + '/'
      : '';
    const url = `${urlBase}/${projectId}/database/${instance}data${this.path}`;

    this.electron.shell.openExternal(url);

    return false;
  }

  private setValidators(): void {
    const dataOriginControl = this.form.get('dataOrigin');
    const infileControl = this.form.get('infile');
    const dataControl = this.form.get('data');

    dataOriginControl.valueChanges
      .pipe(takeWhile(() => !this.destroy))
      .subscribe(dataOrigin => {
        if (dataOrigin === 'file') {
          dataControl.setValidators(null);
          infileControl.setValidators([Validators.required]);
        } else {
          dataControl.setValidators([Validators.required, jsonDataValidator]);
          infileControl.setValidators(null);
        }
        dataControl.updateValueAndValidity();
        infileControl.updateValueAndValidity();
      });
  }
}
