import {
  // ActionReducer,
  ActionReducerMap,
  // createFeatureSelector,
  // createSelector,
  MetaReducer
} from '@ngrx/store';

import { AppConfig } from '../../environments/environment';
import { User } from '../models/user.model';
import { userReducer } from './user.reducers';
import { Workspaces } from '../models/workspaces.model';
import { workspacesReducer } from './workspaces.reducers';
import { Projects } from '../models/projects.model';
import { projectsReducer } from './projects.reducers';

export interface State {
  user: User;
  workspaces: Workspaces;
  projects: Projects;
}

export const reducers: ActionReducerMap<State> = {
  user: userReducer,
  workspaces: workspacesReducer,
  projects: projectsReducer
};

export const metaReducers: MetaReducer<State>[] = !AppConfig.production
  ? []
  : [];
