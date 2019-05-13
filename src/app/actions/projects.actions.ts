import { Action } from '@ngrx/store';

import { FirebaseProject } from '../models/projects.model';

export const GET_LIST = '[Projects] Get Projects List';
export const GET_LIST_SUCCESS = '[Projects] Get Projects List Success';
export const GET_LIST_FAILURE = '[Projects] Get Projects List Failure';

export const GET_SELECTED = '[Projects] Get Selected Project';
export const SET_SELECTED = '[Projects] Set Selected Project';

export const SET_LIST_AND_GET = '[Projects] Set List From Config And Get';

export class GetList implements Action {
  readonly type = GET_LIST;
}

export class GetListSuccess implements Action {
  readonly type = GET_LIST_SUCCESS;
  constructor(public payload: FirebaseProject[]) {}
}

export class GetListFailure implements Action {
  readonly type = GET_LIST_FAILURE;
  constructor(public payload: Error) {}
}

export class GetSelected implements Action {
  readonly type = GET_SELECTED;
}

export class SetSelected implements Action {
  readonly type = SET_SELECTED;
  constructor(public payload: FirebaseProject | null) {}
}

export class SetListAndGet implements Action {
  readonly type = SET_LIST_AND_GET;
  constructor(public payload: FirebaseProject[]) {}
}

export type All =
  | GetList
  | GetListSuccess
  | GetListFailure
  | GetSelected
  | SetSelected
  | SetListAndGet;
