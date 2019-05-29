import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  NgZone,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  ValidationErrors
} from '@angular/forms';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import { Workspace } from '../../../../models/workspaces.model';
import { AppState } from '../../../../models';
import { FirebaseToolsService } from '../../../../providers/firebase-tools.service';
import { ansiToHTML, contains, flattenObject } from '../../../../../utils';

function newKeyValidator(control: FormControl): ValidationErrors | null {
  if (typeof control.value !== 'string' || control.value === '') {
    return { required: true };
  }

  const match = control.value.match(/([^\.]+)\.(.+)/);
  if (!match) {
    return { twoParts: true };
  }

  if (match[1] === 'firebase') {
    return { noFirebase: true };
  }

  return null;
}

@Component({
  selector: 'app-functions-config-section',
  templateUrl: './functions-config-section.component.html',
  styleUrls: ['./functions-config-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class FunctionsConfigSectionComponent implements OnInit, OnDestroy {
  public workspace: Workspace;
  public running = false;
  public form: FormGroup;
  public newKeyForm: FormGroup;
  public config: { [k: string]: any };
  public configLoaded = false;
  public showSuccess = false;
  public showError: SafeHtml | null = null;
  public addModalVisible = false;
  public pendingRemove: { entry: FormGroup; index: number } | null = null;
  public actioning = false;

  public workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  @ViewChild('newKey', { static: true })
  newKey: ElementRef<HTMLInputElement>;

  private destroy = false;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private ngZone: NgZone,
    private store: Store<AppState>,
    private fb: FirebaseToolsService
  ) {}

  async ngOnInit() {
    this.form = this.formBuilder.group({
      entries: this.formBuilder.array([])
    });

    this.newKeyForm = this.formBuilder.group({
      newKey: [null, newKeyValidator]
    });

    this.workspace$.subscribe((workspace: Workspace) => {
      this.ngZone.run(() => {
        this.workspace = workspace;
        this.changeDetRef.markForCheck();
        this.loadConfig();
      });
    });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  get entries(): FormArray {
    return this.form.get('entries') as FormArray;
  }

  showAddEntryModal(): void {
    this.showSuccess = null;
    this.showError = null;
    this.newKey.nativeElement.value = '';
    this.addModalVisible = true;
    setImmediate(() => {
      this.newKey.nativeElement.focus();
    });
  }

  get addEntryValidationError(): string {
    const { errors } = this.newKeyForm.get('newKey');
    if (!errors) {
      return '';
    }

    if (errors.required) {
      return 'You need to provide a key';
    }

    if (errors.twoParts) {
      return 'The key needs to have 2 parts separated by a dot (e.g. foo.bar)';
    }

    if (errors.noFirebase) {
      return 'Cannot use the reserved namespace "firebase"';
    }

    return '';
  }

  addEntry(key: string): void {
    this.addModalVisible = false;
    const entry = this.createEntry(key, '', true);
    // this.form.markAsDirty();
    this.entries.push(entry);
    setImmediate(() => {
      const input = document.querySelector<HTMLInputElement>(
        `input[id="entryInput-${key}"]`
      );
      if (input) {
        this.editEntry(entry, input);
        this.changeDetRef.markForCheck();
      }
    });
  }

  editEntry(entry: FormGroup, input: HTMLInputElement): void {
    entry.setValue({
      ...entry.value,
      value: entry.value.original,
      editing: true
    });
    this.showSuccess = null;
    this.showError = null;
    this.actioning = true;
    setImmediate(() => {
      input.focus();
    });
  }

  entryEditSubmit(event: KeyboardEvent, entry: FormGroup): void {
    event.preventDefault();
    event.stopPropagation();
    this.applyEdit(entry);
  }

  async applyEdit(entry: FormGroup): Promise<void> {
    const { key, value } = entry.value;

    this.showSuccess = null;
    this.showError = null;
    entry.setValue({
      ...entry.value,
      applying: true
    });

    try {
      await this.fb.tools.functions.config.set([`${key}=${value}`], {
        cwd: this.workspace.path,
        project: this.workspace.projectId,
        interactive: true
      });
      this.showSuccess = true;
      this.actioning = false;
      entry.setValue({
        ...entry.value,
        editing: false,
        applying: false,
        original: value,
        value
      });
    } catch (err) {
      console.log(err);
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
      entry.setValue({
        ...entry.value,
        applying: false,
        value
      });
    }

    this.changeDetRef.markForCheck();
  }

  cancelEdit(entry: FormGroup): void {
    entry.setValue({
      ...entry.value,
      value: entry.value.original,
      editing: false
    });
    this.showSuccess = null;
    this.showError = null;
    this.actioning = false;
  }

  showConfirmRemove(entry: FormGroup, index: number): void {
    this.pendingRemove = { entry, index };
    this.showSuccess = null;
    this.showError = null;
  }

  async confirmRemove(): Promise<void> {
    this.showSuccess = null;
    this.showError = null;

    if (this.pendingRemove) {
      const { entry, index } = this.pendingRemove;
      this.pendingRemove = null;
      this.actioning = true;

      console.log(entry.value);
      entry.setValue({
        ...entry.value,
        value: entry.value.original,
        removing: true
      });

      try {
        await this.fb.tools.functions.config.unset([entry.value.key], {
          cwd: this.workspace.path,
          project: this.workspace.projectId,
          interactive: true
        });
        (entry.parent as FormArray).removeAt(index);
      } catch (err) {
        console.log(err);
        this.showError = this.sanitizer.bypassSecurityTrustHtml(
          ansiToHTML(contains(err, 'message') ? err.message : err)
        );
        entry.setValue({
          ...entry.value,
          value: entry.value.original,
          removing: false
        });
      }

      this.actioning = false;
      this.changeDetRef.markForCheck();
    }
  }

  private async loadConfig(): Promise<void> {
    this.config = null;
    this.configLoaded = false;
    this.showSuccess = false;
    this.showSuccess = null;
    this.showError = null;
    this.changeDetRef.markForCheck();

    try {
      this.config = await this.fb.tools.functions.config.get(undefined, {
        cwd: this.workspace.path,
        project: this.workspace.projectId,
        interactive: true
      });
      this.buildForm();
    } catch (err) {
      console.log('Load config error:', err);
      this.showError = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(contains(err, 'message') ? err.message : err)
      );
    }

    this.configLoaded = true;
    this.changeDetRef.markForCheck();
  }

  private buildForm(): void {
    const flatConfig = flattenObject(this.config);
    const formArray = this.formBuilder.array(
      Object.keys(flatConfig)
        .sort()
        .map(key => this.createEntry(key, flatConfig[key]))
    );

    this.form.setControl('entries', formArray);
  }

  private createEntry(
    key: string,
    value: string = '',
    editing = false,
    removing = false,
    applying = false
  ): FormGroup {
    return this.formBuilder.group({
      key,
      value,
      editing,
      removing,
      applying,
      original: value
    });
  }
}
