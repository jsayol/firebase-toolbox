import { Action } from '@ngrx/store';

import { Workspace } from '../models/workspaces.model';

export const GET_LIST = '[Workspaces] Get Workspaces List';
export const GET_LIST_SUCCESS = '[Workspaces] Get Workspaces List Success';

export const GET_SELECTED = '[Workspaces] Get Selected Workspace';
export const SET_SELECTED = '[Workspaces] Set Selected Workspace';

export class GetList implements Action {
  readonly type = GET_LIST;
}

export class GetListSuccess implements Action {
  readonly type = GET_LIST_SUCCESS;
  constructor(public payload: Workspace[]) {}
}

export class GetSelected implements Action {
  readonly type = GET_SELECTED;
}

export class SetSelected implements Action {
  readonly type = SET_SELECTED;
  constructor(public payload: Workspace | null) {}
}

export type All = GetList | GetListSuccess | GetSelected | SetSelected;
