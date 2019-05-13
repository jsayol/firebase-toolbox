import { Action } from '@ngrx/store';

import { UserInfo } from '../models/user.model';

export const GET_USER_EMAIL = '[User] Get User Email';
export const SET_USER_EMAIL = '[User] Set User Email';

export const GET_USER_INFO = '[User] Get User Info';
export const GET_USER_INFO_SUCCESS = '[User] Get User Info Success';
export const GET_USER_INFO_FAILURE = '[User] Get User Info Failure';

export class GetUserEmail implements Action {
  readonly type = GET_USER_EMAIL;
}

export class SetUserEmail implements Action {
  readonly type = SET_USER_EMAIL;
  constructor(public payload: string) {}
}

export class GetUserInfo implements Action {
  readonly type = GET_USER_INFO;
  constructor(public payload: string) {}
}

export class GetUserInfoSuccess implements Action {
  readonly type = GET_USER_INFO_SUCCESS;
  constructor(public payload: UserInfo) {}
}

export class GetUserInfoFailure implements Action {
  readonly type = GET_USER_INFO_FAILURE;
  constructor(public payload: Error) {}
}

export type All =
  | GetUserEmail
  | SetUserEmail
  | GetUserInfo
  | GetUserInfoSuccess
  | GetUserInfoFailure;
