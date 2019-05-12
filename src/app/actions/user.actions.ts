import { Action } from '@ngrx/store';

import { UserDetails } from '../models/user.model';

export const GET_USER = '[User] Get User';
export const GET_USER_SUCCESS = '[User] Get User Success';
export const GET_USER_FAILURE = '[User] Get User Failure';

export class GetUser implements Action {
  readonly type = GET_USER;
}

export class GetUserSuccess implements Action {
  readonly type = GET_USER_SUCCESS;
  constructor(public payload: UserDetails) {}
}

export class GetUserFailure implements Action {
  readonly type = GET_USER_FAILURE;
  constructor(public payload: Error) {}
}

export type All = GetUser | GetUserSuccess | GetUserFailure;
