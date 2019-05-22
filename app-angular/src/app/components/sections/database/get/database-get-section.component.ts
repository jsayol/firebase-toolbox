import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
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
import { contains, ansiToHTML, ifNotEmpty } from '../../../../../utils';
import { DatabaseInstance, DatabaseGetOptions, database } from 'firebase-tools';

@Component({
  selector: 'app-database-get-section',
  templateUrl: './database-get-section.component.html',
  styleUrls: ['./database-get-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class DatabaseGetSectionComponent implements OnInit, OnDestroy {
  workspace: Workspace;
  running = false;
  showSuccess = false;
  showError: SafeHtml | null = null;
  instances: DatabaseInstance[] | null = null;

  form = this.formBuilder.group({
    path: [null, Validators.required],
    output: [null, Validators.required],
    pretty: [false],
    shallow: [false],
    export: [false],
    orderType: ['default'],
    orderChildKey: [null],
    limitType: ['none'],
    limitTo: [null],
    startAt: [null],
    endAt: [null],
    equalTo: [null],
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
    this.workspace$
      .pipe(takeWhile(() => !this.destroy))
      .subscribe(async (workspace: Workspace) => {
        this.workspace = workspace;
        this.changeDetRef.markForCheck();
      });

    this.workspace$
      .pipe(
        takeWhile(() => !this.destroy),
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

  get selectedFile(): string {
    return this.form.get('output').value;
  }

  get orderType(): string {
    return this.form.get('orderType').value;
  }

  get limitType(): string {
    return this.form.get('limitType').value;
  }

  get selectedFileBasename(): string | void {
    const file = this.selectedFile;
    if (file) {
      return this.electron.path.basename(file);
    }
  }

  openFileDialog() {
    this.electron.dialog.showSaveDialog(
      {
        title: 'Choose where to save the database data',
        defaultPath: this.workspace.path,
        filters: [
          {
            name: 'JSON file',
            extensions: ['json']
          }
        ]
      },
      (filePath: string) => {
        this.form.get('output').setValue(filePath || null);
        this.changeDetRef.markForCheck();
      }
    );
  }

  async start(): Promise<void> {
    this.running = true;
    this.showSuccess = false;
    this.showError = null;

    const {
      path,
      limitType,
      limitTo,
      orderType,
      orderChildKey,
      ...rest
    } = this.form.value;

    const options: DatabaseGetOptions = rest;

    if (orderType === 'key') {
      options.orderByKey = true;
    } else if (orderType === 'value') {
      options.orderByValue = true;
    } else if (orderType === 'child') {
      options.orderBy = orderChildKey;
    }

    if (limitType === 'first') {
      options.limitToFirst = limitTo;
    } else if (limitType === 'last') {
      options.limitToLast = limitTo;
    }

    try {
      await this.fb.tools.database.get(path, {
        cwd: this.workspace.path,
        interactive: true,
        ...options
      });
      this.showSuccess = true;
    } catch (err) {
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
      console.log('Database get error', err);
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }

  private setValidators(): void {
    const orderTypeControl = this.form.get('orderType');
    const orderChildKeyControl = this.form.get('orderChildKey');
    const limitTypeControl = this.form.get('limitType');
    const limitToControl = this.form.get('limitTo');

    orderTypeControl.valueChanges
      .pipe(takeWhile(() => !this.destroy))
      .subscribe(orderType => {
        if (orderType !== 'child') {
          orderChildKeyControl.setValidators(null);
        } else {
          orderChildKeyControl.setValidators([Validators.required]);
        }
        orderChildKeyControl.updateValueAndValidity();
      });

    limitTypeControl.valueChanges
      .pipe(takeWhile(() => !this.destroy))
      .subscribe(limitType => {
        if (limitType === 'none') {
          limitToControl.setValidators(null);
        } else {
          limitToControl.setValidators([
            Validators.required,
            Validators.min(1)
          ]);
        }
        limitToControl.updateValueAndValidity();
      });
  }
}
