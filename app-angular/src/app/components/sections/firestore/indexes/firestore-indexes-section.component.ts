import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ElementRef
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
  ElectronService,
  RunningCommand,
  OutputCapture
} from '../../../../providers/electron.service';
import { ansiToHTML, contains } from '../../../../../utils';

@Component({
  selector: 'app-firestore-indexes-section',
  templateUrl: './firestore-indexes-section.component.html',
  styleUrls: ['./firestore-indexes-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class FirestoreIndexesSectionComponent implements OnInit, OnDestroy {
  public workspace: Workspace;
  public running = false;
  public form: FormGroup;
  public modalVisible = false;
  public indexes: any;
  public showError: SafeHtml | null = null;
  public runningCommand: RunningCommand<any> | null = null;

  public workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  @ViewChild('prettyText', { static: false })
  prettyText: ElementRef<HTMLDivElement>;

  private destroy = false;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private store: Store<AppState>,
    private fb: FirebaseToolsService,
    private electron: ElectronService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      format: ['json', Validators.required]
    });

    this.workspace$.subscribe((workspace: Workspace) => {
      this.workspace = workspace;
    });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  get format(): string {
    return this.form.get('format').value;
  }

  async start(): Promise<void> {
    const { format } = this.form.value;
    const outputCapture: OutputCapture = {
      stdout: text => {
        if (format === 'pretty') {
          this.indexes += text;
        }
        console.log(text);
      },
      stderr: text => {
        console.warn(text);
      }
    };

    this.running = true;
    this.showError = null;
    this.indexes = format == 'json' ? null : '';
    this.changeDetRef.markForCheck();

    try {
      this.runningCommand = this.fb.firestoreIndexes(
        outputCapture,
        this.workspace.path,
        { pretty: format === 'pretty' }
      );

      const result = await this.runningCommand.done;
      console.log(result);
      if (format === 'json') {
        this.indexes = JSON.stringify(result, null, 2);
      }
      this.modalVisible = true;
    } catch (err) {
      console.log('Indexes error:', err);
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }

  copy(): void {
    if (this.format === 'json') {
      this.electron.clipboard.writeText(this.indexes);
    } else {
      this.electron.clipboard.writeText(
        this.prettyText.nativeElement.innerText
      );
    }
    this.modalVisible = false;
  }
}
