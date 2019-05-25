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

import { AppState } from '../../../../models';
import { ansiToHTML, contains } from '../../../../../utils';
import { Workspace } from '../../../../models/workspaces.model';
import { FirebaseToolsService } from '../../../../providers/firebase-tools.service';
import {
  OutputCapture,
  RunningCommand
} from '../../../../providers/electron.service';

@Component({
  selector: 'app-firestore-delete-section',
  templateUrl: './firestore-delete-section.component.html',
  styleUrls: ['./firestore-delete-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class FirestoreDeleteSectionComponent implements OnInit, OnDestroy {
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
      target: ['path', Validators.required],
      path: [null, Validators.required],
      method: ['default', Validators.required]
    });

    this.setValidators();

    this.workspace$
      .pipe(takeWhile(() => !this.destroy))
      .subscribe((workspace: Workspace) => {
        this.workspace = workspace;
      });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  get target(): string {
    return this.form.get('target').value;
  }

  async start(): Promise<void> {
    const { target, path, method } = this.form.value;
    const outputCapture: OutputCapture = {
      stdout: text => {
        console.log(text);
      },
      stderr: text => {
        console.warn(text);
      }
    };

    this.running = true;
    this.showError = null;
    this.showSuccess = false;
    this.changeDetRef.markForCheck();

    try {
      this.runningCommand = this.fb.firestoreDelete(
        outputCapture,
        this.workspace,
        target === 'path' ? path : '',
        {
          allCollections: target === 'all',
          recursive: method === 'recursive',
          shallow: method === 'shallow'
        }
      );
      const result = await this.runningCommand.done;
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
      console.log(`Firestore delete error:`, err);
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }

  private setValidators(): void {
    const targetControl = this.form.get('target');
    const pathControl = this.form.get('path');

    targetControl.valueChanges
      .pipe(takeWhile(() => !this.destroy))
      .subscribe(target => {
        if (target === 'path') {
          pathControl.setValidators([Validators.required]);
        } else {
          pathControl.setValidators(null);
        }
        pathControl.updateValueAndValidity();
      });
  }
}
