import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, filter } from 'rxjs/operators';
import { ClrDropdown } from '@clr/angular';

import { AppState } from '../../models';
import { User } from '../../models/user.model';
import { Workspace } from '../../models/workspaces.model';
import { FirebaseProject } from '../../models/projects.model';
import { environment } from '../../../environments/environment';
import * as workspacesActions from '../../actions/workspaces.actions';
import * as userActions from '../../actions/user.actions';
import { ElectronService } from '../../providers/electron.service';
import { FirebaseToolsService } from '../../providers/firebase-tools.service';

const INITIAL_SECTION = environment.production ? 'settings' : 'auth.import';

interface AppInfo {
  version: string;
  fbtools: string;
  electron: string;
  chrome: string;
  node: string;
  v8: string;
  os: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  inactive = false;
  appInfo?: AppInfo;
  infoModalVisible = false;
  projectsListModalVisible = false;
  removeWorkspaceModalVisible = false;
  pendingRemoveWorkspace: Workspace | null = null;

  user$: Observable<User> = this.store.select('user');

  workspace$: Observable<Workspace | null> = this.store.select(
    'workspaces',
    'selected'
  );

  workspaceList$: Observable<Workspace[]> = this.store.select(
    'workspaces',
    'list'
  );

  projectsList$: Observable<FirebaseProject[]> = this.store.select(
    'projects',
    'list'
  );

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private store: Store<AppState>,
    private electron: ElectronService,
    private fb: FirebaseToolsService
  ) {}

  ngOnInit() {
    const win = this.electron.remote.getCurrentWindow();

    win.on('blur', () => {
      this.ngZone.run(() => {
        this.inactive = true;
      });
    });

    win.on('focus', () => {
      this.ngZone.run(() => {
        this.inactive = false;
      });
    });

    // TODO: This is only to speed up the development cycle (avoids having
    // to select a workspace every time). Remove it eventually.
    if (!environment.production) {
      this.workspaceList$
        .pipe(
          filter(list => !!list && list.length > 0),
          first()
        )
        .subscribe(list => {
          const workspace = list.find(w => w.path.endsWith('/emulators-demo'));
          if (workspace) {
            this.selectWorkspace(workspace);
          }
        });
    }
  }

  async logout() {
    this.store.dispatch(new userActions.LogOut());
  }

  openDevTools() {
    this.electron.remote.getCurrentWindow().webContents.openDevTools();
  }

  selectWorkspace(workspace: Workspace): void {
    this.store.dispatch(new workspacesActions.SetSelected(workspace));
    // this.router.navigate(['/home', workspace.path, 'settings']);
    this.router.navigate(['/home', workspace.path, INITIAL_SECTION]);
  }

  getWorkspaceName(workspace: Workspace): string {
    return this.electron.path.basename(workspace.path);
  }

  confirmRemoveWorkspace(
    event: MouseEvent,
    workspace: Workspace,
    dropdown: ClrDropdown
  ): boolean {
    event.preventDefault();
    event.stopPropagation();
    dropdown.ifOpenService.open = false;
    this.pendingRemoveWorkspace = workspace;
    this.removeWorkspaceModalVisible = true;

    return false;
  }

  async removeWorkspaceConfirmed(): Promise<void> {
    this.removeWorkspaceModalVisible = false;
    if (this.pendingRemoveWorkspace) {
      this.fb.removeWorkspace(this.pendingRemoveWorkspace);

      // If the workspace we just removed was the selected one, unselect it
      const workspace = await this.workspace$.pipe(first()).toPromise();
      if (workspace.path === this.pendingRemoveWorkspace.path) {
        this.store.dispatch(new workspacesActions.SetSelected(null));
      }

      this.pendingRemoveWorkspace = null;
      this.store.dispatch(new workspacesActions.GetList());
    }
  }

  dismissRemoveWorkspaceModal(): void {
    this.pendingRemoveWorkspace = null;
    this.removeWorkspaceModalVisible = false;
  }

  addWorkspace(dropdown: ClrDropdown): void {
    dropdown.ifOpenService.open = false;

    this.electron.dialog.showOpenDialog(
      {
        properties: ['openDirectory', 'createDirectory']
      },
      async (paths: string[] | undefined) => {
        if (paths && paths.length > 0) {
          const path = paths[0];

          // First check if it's already an existing workspace
          const workspaces = await this.workspaceList$
            .pipe(first())
            .toPromise();
          const existingWorkspace = workspaces.find(
            workspace => workspace.path === path
          );

          if (existingWorkspace) {
            this.store.dispatch(
              new workspacesActions.SetSelected(existingWorkspace)
            );
          } else {
            const workspace: Workspace = {
              path,
              projectId: null,
              projectAlias: null,
              isBeingAdded: true
            };
            this.store.dispatch(new workspacesActions.SetSelected(workspace));
          }
        }
      }
    );
  }

  showInfo(): void {
    this.loadAppInfo();
    this.infoModalVisible = true;
  }

  copyInfo(): void {
    this.loadAppInfo();

    const appInfoText = `
      Version: ${this.appInfo.version}
      Tools: ${this.appInfo.fbtools}
      Electron: ${this.appInfo.electron}
      Chrome: ${this.appInfo.chrome}
      Node: ${this.appInfo.node}
      V8: ${this.appInfo.v8}
      OS: ${this.appInfo.os}
    `
      .trim()
      .replace(/  +/g, '');

    this.electron.clipboard.writeText(appInfoText);
    this.infoModalVisible = false;
  }

  showProjectsList() {
    this.projectsListModalVisible = true;
  }

  projectPermission(permission: string): string {
    switch (permission) {
      case 'own':
        return 'Owner';
      case 'edit':
        return 'Editor';
      case 'view':
      default:
        return 'Viewer';
    }
  }

  openProjectConsole(project: FirebaseProject): void {
    this.electron.shell.openExternal(
      `https://console.firebase.google.com/project/${project.id}/overview`
    );
  }

  private loadAppInfo(): void {
    if (!this.appInfo) {
      const os = this.electron.os;
      const isSnap =
        process.platform === 'linux' &&
        process.env.SNAP &&
        process.env.SNAP_REVISION;
      this.appInfo = {
        version: this.electron.app.getVersion(),
        fbtools: this.fb.version,
        electron: process.versions['electron'],
        chrome: process.versions['chrome'],
        node: process.versions['node'],
        v8: process.versions['v8'],
        os: `${os.type()} ${os.arch()} ${os.release()}${isSnap ? ' snap' : ''}`
      };
    }
  }
}
