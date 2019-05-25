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
import { ansiToHTML, contains } from '../../../../../utils';
import {
  RunningCommand,
  OutputCapture
} from '../../../../providers/electron.service';

@Component({
  selector: 'app-functions-delete-section',
  templateUrl: './functions-delete-section.component.html',
  styleUrls: ['./functions-delete-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class FunctionsDeleteSectionComponent implements OnInit, OnDestroy {
  public workspace: Workspace;
  public running = false;
  public form: FormGroup;
  public showSuccess = false;
  public showError: SafeHtml | null = null;
  public runningCommand: RunningCommand<void> | null = null;

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
      filters: [null, Validators.required],
      region: [null]
    });

    this.workspace$.subscribe((workspace: Workspace) => {
      this.workspace = workspace;
    });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  async start(): Promise<void> {
    const { filters, region } = this.form.value as {
      filters: string;
      region: string | null;
    };
    const outputCapture: OutputCapture = {
      stdout: text => {
        console.log(text);
      },
      stderr: text => {
        console.warn(text);
      }
    };

    this.running = true;
    this.showSuccess = false;
    this.showError = null;
    this.changeDetRef.markForCheck();

    try {
      this.runningCommand = this.fb.functionsDelete(
        outputCapture,
        this.workspace,
        filters.split(' '),
        { region }
      );
      await this.runningCommand.done;
      this.showSuccess = true;
    } catch (err) {
      // If the user cancels the confirmation, the command rejects with `true`.
      // If the user responds "no" to the confirmation, the command rejects
      // with the string "Command aborted.".
      // We don't want to show an error in either of those case.
      if (err !== true && err !== 'Command aborted.') {
        this.showError = this.sanitizer.bypassSecurityTrustHtml(
          ansiToHTML(contains(err, 'message') ? err.message : err)
        );
      }
      console.log('Delete error:', err);
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }
}
