import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, tap, startWith, concatMap } from 'rxjs/operators';
import { DatabaseInstance } from 'firebase-tools';

import {
  FirebaseToolsService,
  Workspace
} from '../../../../providers/firebase-tools.service';
import { AppState } from '../../../../models';
import { ansiToHTML, contains } from '../../../../../utils';
import { FormControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-database-instances-section',
  templateUrl: './database-instances-section.component.html',
  styleUrls: ['./database-instances-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class DatabaseInstancesSectionComponent implements OnInit {
  workspace: Workspace;
  running = false;
  errorText: SafeHtml = '';
  createModalVisible = false;
  formControl: FormControl;

  instances$: Observable<DatabaseInstance[] | void>;
  workspace$: Observable<Workspace>;
  reloadInstances$ = new Subject<boolean>();

  constructor(
    private fb: FirebaseToolsService,
    private store: Store<AppState>,
    private formBuilder: FormBuilder,
    private changeDetRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.workspace$ = this.store.select('workspaces', 'selected');
    this.instances$ = this.workspace$.pipe(
      tap(workspace => {
        this.workspace = workspace;
      }),
      switchMap(workspace => {
        return this.reloadInstances$.pipe(
          startWith(false),
          concatMap(skipCache => {
            if (workspace) {
              return this.fb.getDatabaseInstances(workspace, skipCache);
            } else {
              return of([]);
            }
          })
        );
      })
    );

    this.formControl = this.formBuilder.control('', Validators.required);

    this.formControl.statusChanges.subscribe(status => {
      if (status === 'INVALID') {
        this.errorText = 'The database instance name is required';
      } else {
        this.errorText = '';
      }
      this.changeDetRef.markForCheck();
    });
  }

  async createInstance() {
    this.running = true;

    const name = this.formControl.value;
    console.log({ name });

    try {
      await this.fb.tools.database.instances.create(name, {
        cwd: this.workspace.path,
        interactive: true
      });
      this.reloadInstances$.next(true);
      this.createModalVisible = false;
    } catch (err) {
      if (contains(err, 'status') && err.status === 409) {
        this.errorText = 'This database instance name is unavailable';
      } else {
        this.errorText = this.sanitizer.bypassSecurityTrustHtml(
          ansiToHTML(contains(err, 'message') ? err.message : err)
        );
      }
      console.log(`Database create instance error`, err);
    }

    this.running = false;
    this.changeDetRef.markForCheck();
  }
}
