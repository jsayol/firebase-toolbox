import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
  NgZone
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable, from, BehaviorSubject, Subject, merge } from 'rxjs';
import { switchMap, takeWhile, map, filter, mapTo, tap } from 'rxjs/operators';
import { UseOptions, InitFeatureName } from 'firebase-tools';

import {
  FirebaseToolsService,
  Workspace,
  FirebaseProject
} from '../../../providers/firebase-tools.service';
import { AppState } from '../../../models';
import { ShellOutputComponent } from '../../shell-output/shell-output.component';
import { OutputCapture } from '../../../providers/electron.service';
import { ansiToHTML, contains } from '../../../../utils';
import * as workspacesActions from '../../../actions/workspaces.actions';

@Component({
  selector: 'app-settings-section',
  templateUrl: './settings-section.component.html',
  styleUrls: ['./settings-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class SettingsSectionComponent implements OnInit, OnDestroy {
  workspace: Workspace;
  workspaceProjects: Array<{ id: string; alias: string }>;
  workspaceFeatures: string[];
  useRunning = false;
  useAddRunning = false;
  initRunning = false;
  featuresRunning = false;
  useAddModalVisible = false;
  initModalVisible = false;

  projectsAlertText: SafeHtml = '';
  featuresAlertText: SafeHtml = '';

  projects$: Observable<FirebaseProject[] | null> = this.store
    .select('projects', 'list')
    .pipe(
      takeWhile(() => !this.destroy),
      map(projects => projects.sort((a, b) => (a.id <= b.id ? -1 : 1)))
    );

  workspace$: Observable<Workspace | null> = this.store
    .select('workspaces', 'selected')
    .pipe(takeWhile(() => !this.destroy));

  private reloadWorkspaceProjects$ = new Subject<void>();

  @ViewChild(ShellOutputComponent, { static: true })
  shellOutput!: ShellOutputComponent;

  private destroy = false;
  private _activeProject: { id: string; alias: string };
  private _isInitialized: boolean;
  private getFeatures$ = new BehaviorSubject<Workspace | null>(null);

  constructor(
    private fb: FirebaseToolsService,
    private store: Store<AppState>,
    private changeDetRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.workspace$.subscribe((workspace: Workspace) => {
      this.workspace = workspace;
      this.getFeatures$.next(workspace);

      if (workspace) {
        this._activeProject = {
          id: workspace.projectId,
          alias: workspace.projectAlias
        };
        this.handleWorkspace();
      } else {
        this._activeProject = null;
      }

      this.changeDetRef.markForCheck();
    });

    const workspaceProjects$ = merge(
      this.workspace$,
      this.reloadWorkspaceProjects$.pipe(mapTo(this.workspace))
    ).pipe(
      takeWhile(() => !this.destroy),
      filter(workspace => !!workspace),
      switchMap(workspace => from(this.fb.getWorkspaceProjects(workspace))),
      tap(projects => {
        // Some times the workspace configuration stored by firebase-tools
        // inludes the project id rather than the alias. We detect this case
        // so that the UI correctly shows the active project.

        const hasSameAlias = projects.some(project => {
          return (
            project.id === this._activeProject.id &&
            project.alias === this._activeProject.alias
          );
        });

        if (
          !hasSameAlias &&
          this._activeProject.id === this._activeProject.alias
        ) {
          const sameProjectById = projects.find(
            project => project.id === this._activeProject.id
          );
          if (sameProjectById) {
            this._activeProject.alias = sameProjectById.alias;
          }
        }
      })
    );

    workspaceProjects$.subscribe(projects => {
      this.workspaceProjects = projects;
      this.ngZone.run(() => this.changeDetRef.markForCheck());
    });

    const workspaceFeatures$ = this.getFeatures$.pipe(
      takeWhile(() => !this.destroy),
      filter(workspace => !!workspace),
      switchMap(workspace => from(this.fb.getWorkspaceFeatures(workspace))),
      map(features => features.map(f => f.charAt(0).toUpperCase() + f.slice(1)))
    );

    workspaceFeatures$.subscribe(features => {
      this.workspaceFeatures = features;
      this.ngZone.run(() => this.changeDetRef.markForCheck());
    });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  get isInitialized(): boolean {
    if (this._isInitialized) {
      return true;
    }
    return this.fb.isWorkspaceInitialized(this.workspace);
  }

  get activeProject(): string {
    return this.toProjectValue(this._activeProject);
  }

  set activeProject(projectValue: string) {
    const oldActive = this._activeProject;
    this._activeProject = this.fromProjectValue(projectValue);
    this.useRunning = true;

    this.fb.tools
      .use(this._activeProject.alias, {
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
        this.store.dispatch(
          new workspacesActions.SetSelected({
            ...this.workspace,
            projectId: this._activeProject.id,
            projectAlias: this._activeProject.alias
          })
        );
        this.useRunning = false;
        this.changeDetRef.markForCheck();
      });
  }

  toProjectValue(project: { id: string; alias: string }): string {
    return `${project.id}<#>${project.alias}`;
  }

  fromProjectValue(projectValue: string): { id: string; alias: string } {
    const [id, alias] = projectValue.split('<#>');
    return { id, alias };
  }

  dismissProjectsAlert() {
    this.projectsAlertText = '';
  }

  dismissFeaturesAlert() {
    this.featuresAlertText = '';
  }

  get projectsRunning(): boolean {
    return this.useRunning || this.useAddRunning;
  }

  showUseAddModal() {
    this.useAddModalVisible = true;
  }

  dismissUseAddModal() {
    this.useAddModalVisible = false;
    if (this.workspace.isBeingAdded) {
      this.store.dispatch(new workspacesActions.SetSelected(null));
    }
  }

  showInitModal() {
    this.initModalVisible = true;
  }

  async useAddProject(projectId: any, projectAlias: any): Promise<void> {
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
      await this.fb.tools.use(projectId, options);
      this.store.dispatch(new workspacesActions.GetList());
    } catch (err) {
      console.log(err);
      this.projectsAlertText = this.sanitizer.bypassSecurityTrustHtml(
        ansiToHTML(err && err.message ? err.message : err)
      );
    }

    if (this.workspace.isBeingAdded) {
      this.workspace.isBeingAdded = false;
      this.reloadWorkspaceProjects$.next();
    }

    this.useAddRunning = false;
    this.store.dispatch(
      new workspacesActions.SetSelected({
        ...this.workspace,
        projectAlias,
        projectId
      })
    );
    this.changeDetRef.markForCheck();
  }

  async initFeature(feature?: InitFeatureName): Promise<void> {
    const output: OutputCapture = {
      stdout: text => {
        this.shellOutput.stdout(text);
      },
      stderr: text => {
        this.shellOutput.stderr(text);
      }
    };

    this.initRunning = true;
    this.shellOutput.clear();
    this.shellOutput.open();
    this.changeDetRef.markForCheck();

    try {
      const runningCommand = this.fb.init(output, this.workspace.path, feature);
      const resp = await runningCommand.done;
    } catch (err) {
      console.log('Init error:', err);
    }

    if (this.workspace.isBeingAdded) {
      this.workspace.isBeingAdded = false;
      this.reloadWorkspaceProjects$.next();
      this.store.dispatch(new workspacesActions.GetList());
    }

    this.initRunning = false;
    this.getFeatures$.next(this.workspace);
    this.changeDetRef.markForCheck();
  }

  private async handleWorkspace(): Promise<void> {
    this._isInitialized = this.fb.isWorkspaceInitialized(this.workspace);

    if (this.workspace.isBeingAdded) {
      if (this._isInitialized) {
        try {
          const rcFile = await this.fb.readRcFile(this.workspace);
          if (
            contains(rcFile, 'projects') &&
            Object.keys(rcFile.projects).length > 0
          ) {
            const aliases = Object.keys(rcFile.projects);
            let projectId: string;
            let projectAlias: string;

            if (contains(rcFile.projects, 'default')) {
              projectId = rcFile.projects.default;
              projectAlias = 'default';
            } else {
              projectId = rcFile.projects[aliases[0]];
              projectAlias = aliases[0];
            }

            this.useAddProject(projectId, projectAlias);
          } else {
            this.showUseAddModal();
          }
        } catch (err) {
          this.showUseAddModal();
        }
      } else {
        this.initFeature();
      }
    }
  }
}
