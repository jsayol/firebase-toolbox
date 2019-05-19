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
  infoModalVisible = false;
  appInfo?: AppInfo;

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
    this.router.navigate(['/home', workspace.path, 'serve']);
  }

  getWorkspaceName(workspace: Workspace): string {
    return this.electron.path.basename(workspace.path);
  }

  removeWorkspace(
    event: MouseEvent,
    workspace: Workspace,
    dropdown: ClrDropdown
  ): boolean {
    event.preventDefault();
    event.stopPropagation();
    dropdown.ifOpenService.open = false;

    // TODO: dialog asking the user if they want to remove the workspace

    return false;
  }

  addWorkspace(dropdown: ClrDropdown): void {
    dropdown.ifOpenService.open = false;

    // TODO: dialog to add a workspace
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
