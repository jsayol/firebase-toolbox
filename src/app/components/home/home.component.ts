import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { User } from '../../models/user.model';
import { Workspaces, Workspace } from '../../models/workspaces.model';
import { FirebaseProject } from '../../models/projects.model';

interface AppState {
  user: User;
  workspaces: Workspaces;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  gaming = [];
  
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

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
    // this.store.dispatch(new userActions.GetUser());
    // this.store.dispatch(new workspacesActions.GetList());
  }

  modelChange($event) {
    console.log({ $event, gaming: this.gaming });
  }
}
