import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  NgZone
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl
} from '@angular/forms';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable, of, combineLatest } from 'rxjs';
import { takeWhile, switchMap, catchError } from 'rxjs/operators';
import { DatabaseInstance } from 'firebase-tools';

import { Workspace } from '../../../../models/workspaces.model';
import { AppState } from '../../../../models';
import { FirebaseToolsService } from '../../../../providers/firebase-tools.service';
import {
  ElectronService,
  RunningCommand,
  OutputCapture
} from '../../../../providers/electron.service';

interface ReportTable {
  legend: string[];
  data: Array<Array<string | number>>;
  note?: string;
}

interface Report {
  totalTime: number;
  readSpeed: ReportTable;
  writeSpeed: ReportTable;
  broadcastSpeed: ReportTable;
  connectSpeed: ReportTable;
  disconnectSpeed: ReportTable;
  unlistenSpeed: ReportTable;
  downloadedBytes: ReportTable;
  uploadedBytes: ReportTable;
  unindexedQueries: ReportTable;
}

function formatWhenInputFileValidator(
  control: AbstractControl
): { [k: string]: any } | null {
  if (control.value === 'raw') {
    return { format: true };
  } else {
    return null;
  }
}

@Component({
  selector: 'app-database-profile-section',
  templateUrl: './database-profile-section.component.html',
  styleUrls: ['./database-profile-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class DatabaseProfileSectionComponent implements OnInit, OnDestroy {
  public workspace: Workspace;
  public running = false;
  public showSuccess = false;
  public showError: SafeHtml | null = null;
  public inputFile: string | null = null;
  public outputFile: string | null = null;
  public instances: DatabaseInstance[] | null = null;
  public form: FormGroup;
  public runningCommand: RunningCommand<any> | null = null;
  public report: Report | null = null;
  public reportModalVisible = false;
  public recordedOperations: number | null = null;

  public workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  public reportGroups = [
    {
      title: 'Speed Report',
      noteField: 'readSpeed',
      tables: [
        { title: 'Read Speed', field: 'readSpeed' },
        { title: 'Write Speed', field: 'writeSpeed' },
        { title: 'Broadcast Speed', field: 'broadcastSpeed' },
        { title: 'Connect Speed', field: 'connectSpeed' },
        { title: 'Disconnect Speed', field: 'disconnectSpeed' },
        { title: 'Unlisten Speed', field: 'unlistenSpeed' }
      ]
    },
    {
      title: 'Bandwidth Report',
      noteField: 'downloadedBytes',
      tables: [
        { title: 'Downloaded Bytes', field: 'downloadedBytes' },
        { title: 'Uploaded Bytes', field: 'uploadedBytes' },
        { title: 'Unindexed Queries', field: 'unindexedQueries' }
      ]
    }
  ];

  private destroy = false;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    private store: Store<AppState>,
    private fb: FirebaseToolsService,
    private electron: ElectronService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      origin: ['database', Validators.required],
      inputFile: [null],
      output: ['screen', Validators.required],
      outputFile: [null],
      format: ['text', Validators.required],
      stopCondition: ['manual', Validators.required],
      duration: [null],
      collapse: [true],
      instance: [null]
    });

    this.setValidators();

    this.workspace$
      .pipe(takeWhile(() => !this.destroy))
      .subscribe((workspace: Workspace) => {
        this.workspace = workspace;
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

  get origin(): string {
    return this.form.get('origin').value;
  }

  get output(): string {
    return this.form.get('output').value;
  }

  get stopCondition(): string {
    return this.form.get('stopCondition').value;
  }

  openInputFileDialog() {
    this.electron.dialog.showOpenDialog(
      {
        title: 'Choose where to save the generated report',
        defaultPath: this.workspace.path,
        filters: [
          {
            name: 'JSON or TXT',
            extensions: ['json', 'txt']
          }
        ]
      },
      (filepaths: string[]) => {
        this.inputFile =
          filepaths && filepaths.length > 0 ? filepaths[0] : null;
        this.form.get('inputFile').setValue(this.inputFile ? true : null);
        this.changeDetRef.markForCheck();
      }
    );
  }

  openOutputFileDialog(file: 'input' | 'output') {
    this.electron.dialog.showSaveDialog(
      {
        title: 'Choose where to save the generated report',
        defaultPath: this.workspace.path,
        filters: [
          {
            name: 'JSON or TXT',
            extensions: ['json', 'txt']
          }
        ]
      },
      (filepath: string) => {
        this.outputFile = filepath || null;
        this.form.get('outputFile').setValue(this.outputFile ? true : null);
        this.changeDetRef.markForCheck();
      }
    );
  }

  get inputFileBasename(): string | void {
    if (this.inputFile) {
      return this.electron.path.basename(this.inputFile);
    }
  }

  get outputFileBasename(): string | void {
    if (this.outputFile) {
      return this.electron.path.basename(this.outputFile);
    }
  }

  get formatControl(): AbstractControl {
    return this.form.get('format');
  }

  async start(): Promise<void> {
    const outputCapture: OutputCapture = {
      stdout: text => {
        console.log(text);
        this.ngZone.run(() => {
          const match = text.match(/^(\d+) operations recorded/);
          if (match) {
            this.recordedOperations = Number(match[1]);
            this.changeDetRef.markForCheck();
          }
        });
      },
      stderr: text => {
        console.warn(text);
      }
    };

    const {
      origin,
      output,
      format,
      stopCondition,
      duration,
      collapse,
      instance
    } = this.form.value;

    this.running = true;
    this.report = null;
    this.recordedOperations = origin === 'database' ? 0 : null;
    this.changeDetRef.markForCheck();

    try {
      this.runningCommand = this.fb.databaseProfile(
        outputCapture,
        this.workspace.path,
        {
          parent: {
            json: output === 'screen' || format === 'json'
          },
          input: origin === 'file' ? this.inputFile : undefined,
          output: output === 'file' ? this.outputFile : undefined,
          duration:
            origin === 'database' && stopCondition === 'duration'
              ? duration
              : undefined,
          raw: output === 'file' && format === 'raw',
          noCollapse: !collapse,
          instance: instance
        }
      );
      const result = await this.runningCommand.done;
      console.log('Profile done:', result);
      if (output === 'screen') {
        this.report = result;
        this.reportModalVisible = true;
      }
    } catch (err) {
      console.log('Profile error:', err);
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }

  stop(): void {
    if (this.runningCommand) {
      this.runningCommand.stdin('\n');
    }
  }

  cancel(): void {
    if (this.runningCommand) {
      this.runningCommand.kill();
    }
  }

  private setValidators(): void {
    const originControl = this.form.get('origin');
    const inputFileControl = this.form.get('inputFile');
    const formatControl = this.form.get('format');
    const outputControl = this.form.get('output');
    const outputFileControl = this.form.get('outputFile');
    const stopConditionControl = this.form.get('stopCondition');
    const durationControl = this.form.get('duration');

    combineLatest(originControl.valueChanges, outputControl.valueChanges)
      .pipe(takeWhile(() => !this.destroy))
      .subscribe(([origin, output]) => {
        this.ngZone.run(() => {
          if (output === 'file') {
            const formatValidators = [Validators.required];
            if (origin === 'file') {
              formatValidators.push(formatWhenInputFileValidator);
            }
            formatControl.setValidators(formatValidators);
            outputFileControl.setValidators([Validators.required]);
          } else {
            formatControl.setValidators(null);
            outputFileControl.setValidators(null);
          }

          if (origin === 'file') {
            inputFileControl.setValidators([Validators.required]);
          } else {
            inputFileControl.setValidators(null);
          }

          outputFileControl.updateValueAndValidity();
          inputFileControl.updateValueAndValidity();
          formatControl.updateValueAndValidity();
          this.changeDetRef.detectChanges();
        });
      });

    combineLatest(originControl.valueChanges, stopConditionControl.valueChanges)
      .pipe(takeWhile(() => !this.destroy))
      .subscribe(([origin, stopCondition]) => {
        this.ngZone.run(() => {
          if (origin === 'file' || stopCondition !== 'duration') {
            durationControl.setValidators(null);
          } else {
            durationControl.setValidators([
              Validators.required,
              Validators.min(0.000000001)
            ]);
          }
          durationControl.updateValueAndValidity();
          this.changeDetRef.detectChanges();
        });
      });
  }
}
