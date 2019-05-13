import { Injectable } from '@angular/core';
import { Effect, Actions, ofType, OnInitEffects } from '@ngrx/effects';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';

import * as userActions from '../actions/user.actions';
import {
  FirebaseToolsService,
  UserInfo
} from '../providers/firebase-tools.service';
import { ElectronService } from '../providers/electron.service';

export type Action = userActions.All;

@Injectable()
export class UserEffects implements OnInitEffects {
  constructor(
    private actions$: Actions,
    private fb: FirebaseToolsService,
    private electron: ElectronService
  ) {}

  @Effect()
  getUser$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.GET_USER, userActions.SET_USER_AND_GET),
    switchMap(() =>
      from(this.fb.getUser()).pipe(
        map(userInfo => new userActions.GetUserSuccess(userInfo)),
        catchError(error => of(new userActions.GetUserFailure(error)))
      )
    )
  );

  @Effect({ dispatch: false })
  saveState = this.actions$.pipe(
    ofType(userActions.GET_USER_SUCCESS, userActions.GET_USER_FAILURE),
    tap((action: userActions.GetUserSuccess | userActions.GetUserFailure) => {
      this.electron.configSet('user', action.payload);
      console.log({ user: action.payload });
    })
  );

  ngrxOnInitEffects(): Action {
    const userInfo = this.electron.configGet<UserInfo>('user');
    return userInfo
      ? new userActions.SetUserAndGet(userInfo)
      : new userActions.GetUser();
  }
}
