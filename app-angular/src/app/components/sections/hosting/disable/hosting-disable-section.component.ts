import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import {
  FirebaseToolsService,
  Workspace
} from '../../../../providers/firebase-tools.service';
import { AppState } from '../../../../models';
import { contains, ansiToHTML } from '../../../../../utils';

@Component({
  selector: 'app-hosting-disable-section',
  templateUrl: './hosting-disable-section.component.html',
  styleUrls: ['./hosting-disable-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class HostingDisableSectionComponent implements OnInit, OnDestroy {
  public workspace: Workspace;
  public running = false;
  public showSuccess = false;
  public showError: SafeHtml | null = null;
  public confirmModalVisible = false;

  public workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  private destroy = false;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private store: Store<AppState>,
    private fb: FirebaseToolsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.workspace$.subscribe((workspace: Workspace) => {
      this.workspace = workspace;
      this.changeDetRef.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  showConfirmModal(): void {
    this.showSuccess = false;
    this.showError = null;
    this.confirmModalVisible = true;
  }

  async start(): Promise<void> {
    this.confirmModalVisible = false;
    this.running = true;
    this.showSuccess = false;
    this.showError = null;
    this.changeDetRef.markForCheck();

    try {
      await this.fb.tools.hosting.disable({
        cwd: this.workspace.path,
        project: this.workspace.projectId,
        interactive: true,
        confirm: true
      });
      this.showSuccess = true;
    } catch (err) {
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
      console.log(`Hosting disable error`, err);
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }
}
