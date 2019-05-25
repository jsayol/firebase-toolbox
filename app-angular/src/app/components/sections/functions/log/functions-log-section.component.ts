import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import { Workspace } from '../../../../models/workspaces.model';
import { AppState } from '../../../../models';
import { FirebaseToolsService } from '../../../../providers/firebase-tools.service';
import {
  ansiToHTML,
  contains,
  CloudFunctionLogEntry
} from '../../../../../utils';

@Component({
  selector: 'app-functions-log-section',
  templateUrl: './functions-log-section.component.html',
  styleUrls: ['./functions-log-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class FunctionsLogSectionComponent implements OnInit, OnDestroy {
  public workspace: Workspace;
  public running = false;
  public form: FormGroup;
  public modalVisible = false;
  public showError: SafeHtml | null = null;
  public entries: CloudFunctionLogEntry[] | null = null;

  public workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  private destroy = false;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private store: Store<AppState>,
    private fb: FirebaseToolsService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      display: ['show', Validators.required],
      only: [null],
      lines: [null, Validators.min(0)]
    });

    this.workspace$.subscribe((workspace: Workspace) => {
      this.workspace = workspace;
    });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  get display(): 'show' | 'open' {
    return this.form.get('display').value;
  }

  async start(): Promise<void> {
    const { display, only, lines } = this.form.value;

    this.running = true;
    this.entries = null;
    this.changeDetRef.markForCheck();

    try {
      const result = await this.fb.tools.functions.log({
        cwd: this.workspace.path,
        project: this.workspace.projectId,
        only: typeof only === 'string' ? only.replace(/ /g, '') : undefined,
        open: display === 'open',
        lines
      });
      console.log(result);

      if (display === 'show') {
        this.entries = result;
        this.modalVisible = true;
      }
    } catch (err) {
      console.log('Logs error:', err);
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }

  isJson(text: string | undefined): boolean {
    return typeof text === 'string' && text.startsWith('{ ');
  }
}
