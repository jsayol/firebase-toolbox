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

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  inactive = false;

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
    // TODO: this should dispatch a "Logout" ngrx action instead
    await this.fb.logout();
    this.store.dispatch(new userActions.GetUserEmail());
  }

  openDevTools() {
    this.electron.remote.getCurrentWindow().webContents.openDevTools();
  }

  selectWorkspace(workspace: Workspace): void {
    this.store.dispatch(new workspacesActions.SetSelected(workspace));
    this.router.navigate(['home', 'settings']);
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
}
