import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../models';
import { User } from '../../models/user.model';
import { Workspace } from '../../models/workspaces.model';
import { FirebaseProject } from '../../models/projects.model';

import * as workspacesActions from '../../actions/workspaces.actions';
import * as userActions from '../../actions/user.actions';
import { ElectronService } from '../../providers/electron.service';
import { FirebaseToolsService } from '../../providers/firebase-tools.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
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
    private store: Store<AppState>,
    private electron: ElectronService,
    private fb: FirebaseToolsService
  ) {}

  ngOnInit() {}

  async logout() {
    // TODO: this should dispatch a "Logout" ngrx action instead
    await this.fb.logout();
    this.store.dispatch(new userActions.GetUserEmail());
  }

  selectWorkspace(workspace: Workspace): void {
    this.store.dispatch(new workspacesActions.SetSelected(workspace));
  }

  getWorkspaceName(workspace: Workspace): string {
    return this.electron.path.basename(workspace.path);
  }
}
