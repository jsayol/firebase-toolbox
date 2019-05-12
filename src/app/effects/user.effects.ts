import { Injectable } from '@angular/core';
import { Effect, Actions, ofType, OnInitEffects } from '@ngrx/effects';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import * as userActions from '../actions/user.actions';
import { FirebaseToolsService } from '../providers/firebase-tools.service';

export type Action = userActions.All;

@Injectable()
export class UserEffects implements OnInitEffects {
  constructor(private actions$: Actions, private fb: FirebaseToolsService) {}

  @Effect()
  getUser$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.GET_USER),
    switchMap(() =>
      from(this.fb.getUser()).pipe(
        map(userInfo => new userActions.GetUserSuccess(userInfo)),
        catchError(error => of(new userActions.GetUserFailure(error)))
      )
    )
  );

  ngrxOnInitEffects(): Action {
    return new userActions.GetUser();
  }
}
