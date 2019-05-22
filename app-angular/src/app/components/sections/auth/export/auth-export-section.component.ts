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

import {
  FirebaseToolsService,
  Workspace
} from '../../../../providers/firebase-tools.service';
import { ElectronService } from '../../../../providers/electron.service';
import { AppState } from '../../../../models';
import { contains, ansiToHTML } from '../../../../../utils';

@Component({
  selector: 'app-auth-export-section',
  templateUrl: './auth-export-section.component.html',
  styleUrls: ['./auth-export-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class AuthExportSectionComponent implements OnInit, OnDestroy {
  workspace: Workspace;
  running = false;
  showSuccess = false;
  showError: SafeHtml | null = null;
  selectedFile: string | null = null;

  workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  private destroy = false;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private store: Store<AppState>,
    private fb: FirebaseToolsService,
    private electron: ElectronService,
    private sanitizer: DomSanitizer
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
    this.electron.dialog.showSaveDialog(
      {
        title: 'Choose where to save the exported users data',
        defaultPath: this.workspace.path,
        filters: [
          {
            name: 'JSON or CSV',
            extensions: ['json', 'csv']
          }
        ]
      },
      (filename: string) => {
        this.selectedFile = filename || null;
        this.changeDetRef.markForCheck();
      }
    );
  }

  get selectedFileBasename(): string | void {
    if (this.selectedFile) {
      return this.electron.path.basename(this.selectedFile);
    }
  }

  async startExport(): Promise<void> {
    this.running = true;
    this.showSuccess = false;
    this.showError = null;

    try {
      await this.fb.tools.auth.export(this.selectedFile, {
        cwd: this.workspace.path,
        interactive: true
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
