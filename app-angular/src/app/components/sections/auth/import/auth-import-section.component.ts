import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { ClrLoadingState } from '@clr/angular';
import { Observable } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { AuthImportOptions } from 'firebase-tools';

import {
  FirebaseToolsService,
  Workspace,
  FirebaseProject
} from '../../../../providers/firebase-tools.service';
import { ElectronService } from '../../../../providers/electron.service';
import { AppState } from '../../../../models';
import { contains, ansiToHTML } from '../../../../../utils';
import { RequestService } from '../../../../providers/request.service';

function ifNotEmpty<T = any>(
  value: T
): Exclude<Exclude<T, ''>, null> | undefined {
  if ((value as any) === '' || value === null) {
    return;
  }

  return value as any;
}

@Component({
  selector: 'app-auth-import-section',
  templateUrl: './auth-import-section.component.html',
  styleUrls: ['./auth-import-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class AuthImportSectionComponent implements OnInit, OnDestroy {
  workspace: Workspace;
  running = false;
  showSuccess = false;
  showError: SafeHtml | null = null;
  selectedFile: string | null = null;
  fileOrigin = 'firebase';
  originProject = '';
  originConfigLoaded = false;
  loadingOriginConfig = false;
  hashAlgo: AuthImportOptions['hashAlgo'] | '' = '';
  hashInputOrder: AuthImportOptions['hashInputOrder'] | '' = '';
  hashKey = '';
  saltSeparator = '';
  rounds: number | null = null;
  memCost: number | null = null;
  parallelization: number | null = null;
  blockSize: number | null = null;
  dkLen: number | null = null;

  workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  projectsList$: Observable<FirebaseProject[]> = this.store.select(
    'projects',
    'list'
  );

  private destroy = false;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private store: Store<AppState>,
    private fb: FirebaseToolsService,
    private electron: ElectronService,
    private sanitizer: DomSanitizer,
    private request: RequestService
  ) {}

  ngOnInit() {
    this.workspace$
      .pipe(takeWhile(() => !this.destroy))
      .subscribe((workspace: Workspace) => {
        this.workspace = workspace;
      });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  onDataFile(event: any) {
    console.log(event);
  }

  openFileDialog() {
    this.electron.dialog.showOpenDialog(
      {
        title: 'Choose the file containing the users data',
        defaultPath: this.workspace.path,
        properties: ['openFile'],
        filters: [
          {
            name: 'JSON or CSV',
            extensions: ['json', 'csv']
          }
        ]
      },
      (paths: string[]) => {
        this.selectedFile = paths && paths.length > 0 ? paths[0] : null;
        this.changeDetRef.markForCheck();
      }
    );
  }

  get selectedFileBasename(): string | void {
    if (this.selectedFile) {
      return this.electron.path.basename(this.selectedFile);
    }
  }

  async loadProjectConfig(projectId: string) {
    this.loadingOriginConfig = true;
    this.originConfigLoaded = false;

    try {
      const config = await this.request.getProjectHashAlgoConfig(
        this.workspace.projectId
      );
      this.hashAlgo = config.hashAlgo;
      this.hashKey = config.hashKey;
      this.saltSeparator = config.saltSeparator;
      this.rounds = config.rounds;
      this.memCost = config.memCost;
    } catch (err) {
      this.hashAlgo = '';
      this.hashKey = '';
      this.saltSeparator = '';
      this.rounds = null;
      this.memCost = null;
    }

    this.originConfigLoaded = true;
    this.loadingOriginConfig = false;
    this.changeDetRef.markForCheck();
  }

  async start(): Promise<void> {
    this.running = true;
    this.showSuccess = false;
    this.showError = null;

    try {
      await this.fb.tools.auth.upload(this.selectedFile, {
        cwd: this.workspace.path,
        interactive: true,
        hashAlgo: ifNotEmpty(this.hashAlgo),
        rounds: ifNotEmpty(this.rounds),
        memCost: ifNotEmpty(this.memCost),
        saltSeparator: ifNotEmpty(this.saltSeparator),
        parallelization: ifNotEmpty(this.parallelization),
        blockSize: ifNotEmpty(this.blockSize),
        dkLen: ifNotEmpty(this.dkLen),
        hashKey: ifNotEmpty(this.hashKey),
        hashInputOrder: ifNotEmpty(this.hashInputOrder)
      });
      this.showSuccess = true;
      console.log('Export done!');
    } catch (err) {
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
      console.log('Export error', err);
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }
}
