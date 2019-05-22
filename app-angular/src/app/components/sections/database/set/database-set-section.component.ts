import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { takeWhile, switchMap, catchError } from 'rxjs/operators';

import {
  FirebaseToolsService,
  Workspace
} from '../../../../providers/firebase-tools.service';
import { ElectronService } from '../../../../providers/electron.service';
import { AppState } from '../../../../models';
import { contains, ansiToHTML } from '../../../../../utils';
import { DatabaseInstance, DatabaseSetOptions } from 'firebase-tools';

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

function databasePathValidator(
  control: AbstractControl
): { [key: string]: any } | null {
  if (typeof control.value === 'string' && control.value.startsWith('/')) {
    return null;
  } else {
    return { path: 'Path must begin with /' };
  }
}

@Component({
  selector: 'app-database-set-section',
  templateUrl: './database-set-section.component.html',
  styleUrls: ['./database-set-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class DatabaseSetSectionComponent implements OnInit, OnDestroy {
  workspace: Workspace;
  running = false;
  showSuccess = false;
  showError: SafeHtml | null = null;
  instances: DatabaseInstance[] | null = null;
  confirmModalVisible = false;

  form = this.formBuilder.group({
    path: [
      null,
      Validators.compose([Validators.required, databasePathValidator])
    ],
    dataOrigin: ['file', Validators.required],
    infile: [null, Validators.required],
    data: [null],
    instance: [null]
  });

  workspace$: Observable<Workspace | null> = this.store
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
    this.setValidators();
    this.workspace$.subscribe(async (workspace: Workspace) => {
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
        title: 'Choose the file containing the database data to set',
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

    try {
      await this.fb.tools.database.set(path, infile, {
        cwd: this.workspace.path,
        interactive: true,
        instance,
        data,
        confirm: true
      });
      this.showSuccess = true;
    } catch (err) {
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
      console.log('Database set error', err);
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
