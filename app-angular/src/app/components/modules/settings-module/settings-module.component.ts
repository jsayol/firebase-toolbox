import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable, from } from 'rxjs';
import { switchMap, takeWhile, map, filter } from 'rxjs/operators';
import { UseOptions } from 'firebase-tools';

import {
  FirebaseToolsService,
  Workspace,
  FirebaseProject
} from '../../../providers/firebase-tools.service';
import { AppState } from '../../../models';
import { ShellOutputComponent } from '../../shell-output/shell-output.component';
import { OutputCapture } from '../../../providers/electron.service';
import { ansiToHTML } from '../../../../utils';
import * as workspacesActions from '../../../actions/workspaces.actions';

@Component({
  selector: 'app-settings-module',
  templateUrl: './settings-module.component.html',
  styleUrls: ['./settings-module.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class SettingsModuleComponent implements OnInit, OnDestroy {
  workspace: Workspace;
  useRunning = false;
  useAddRunning = false;
  initRunning = false;
  showProjectsProgress = false;
  projectsAlertText: SafeHtml = '';
  useAddModalVisible = false;

  projects$: Observable<FirebaseProject[] | null> = this.store
    .select('projects', 'list')
    .pipe(
      takeWhile(() => !this.destroy),
      map(projects => projects.sort((a, b) => (a.id <= b.id ? -1 : 1)))
    );

  workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  workspaceProjects$ = this.workspace$.pipe(
    filter(workspace => !!workspace),
    switchMap(workspace => from(this.fb.getWorkspaceProjects(workspace)))
  );

  @ViewChild(ShellOutputComponent)
  shellOutput!: ShellOutputComponent;

  private destroy = false;
  private _activeProject: string;

  constructor(
    private fb: FirebaseToolsService,
    private store: Store<AppState>,
    private changeDetRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.workspace$
      .pipe(takeWhile(() => !this.destroy))
      .subscribe((workspace: Workspace) => {
        console.log({ workspace });
        this.workspace = workspace;
        this._activeProject = workspace.projectId;
      });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  get activeProject(): string {
    return this._activeProject;
  }

  set activeProject(projectId: string) {
    const oldActive = this._activeProject;
    this._activeProject = projectId;
    this.useRunning = true;
    console.log('useProject:', projectId);

    this.fb.cli
      .use(projectId, {
        cwd: this.workspace.path,
        interactive: true
      })
      .catch(err => {
        console.log(err);
        this._activeProject = oldActive;
        this.projectsAlertText = this.sanitizer.bypassSecurityTrustHtml(
          ansiToHTML(err && err.message ? err.message : err)
        );
      })
      .then(() => {
        this.store.dispatch(new workspacesActions.GetList());
        this.useRunning = false;
        this.changeDetRef.markForCheck();
      });
  }

  dismissProjectsAlert() {
    this.projectsAlertText = '';
  }

  get projectsRunning(): boolean {
    return this.useRunning || this.useAddRunning;
  }

  showUseAddModal() {
    this.useAddModalVisible = true;
  }

  async useAddProject(projectId: any, projectAlias: any): Promise<void> {
    console.log({ projectId, projectAlias });
    this.useAddModalVisible = false;
    this.useAddRunning = true;

    const options: UseOptions = {
      cwd: this.workspace.path,
      interactive: true
    };

    if (projectAlias) {
      // TODO: open PR to firebase-tools so that it recognizes this option
      options.alias = projectAlias;
    }

    try {
      await this.fb.cli.use(projectId, options);
      this.store.dispatch(new workspacesActions.GetList());
    } catch (err) {
      console.log(err);
      this.projectsAlertText = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(err && err.message ? err.message : err)
      );
    }

    this.store.dispatch(
      new workspacesActions.SetSelected({
        ...this.workspace,
        projectAlias,
        projectId
      })
    );
    this.useAddRunning = false;
    this.changeDetRef.markForCheck();
  }

  async init(): Promise<void> {
    this.initRunning = true;
    const output: OutputCapture = {
      stdout: text => {
        this.shellOutput.stdout(text);
      },
      stderr: text => {
        this.shellOutput.stderr(text);
      }
    };

    try {
      const resp = await this.fb.init(output, this.workspace.path, 'firestore');
      console.log('Init done:', resp);
    } catch (err) {
      console.log('Init error:', err);
    }

    this.initRunning = false;
    this.changeDetRef.markForCheck();
  }
}
