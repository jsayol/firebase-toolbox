import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Effect, Actions, ofType, OnInitEffects } from '@ngrx/effects';
import { Observable, from, of, empty } from 'rxjs';
import { map, switchMap, catchError, tap, startWith } from 'rxjs/operators';

import * as userActions from '../actions/user.actions';
import { FirebaseToolsService } from '../providers/firebase-tools.service';
import { ConfigService } from '../providers/config.service';

export type Action = userActions.All;

@Injectable()
export class UserEffects implements OnInitEffects {
  constructor(
    private actions$: Actions,
    private fb: FirebaseToolsService,
    private config: ConfigService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  @Effect()
  getUserEmail$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.GET_USER_EMAIL),
    switchMap(() =>
      of(this.fb.getUserEmail()).pipe(
        switchMap(email => {
          const actions: userActions.All[] = [
            new userActions.SetUserEmail(email)
          ];
          if (email) {
            actions.push(new userActions.GetUserInfo(email));
          }
          return actions;
        })
      )
    )
  );

  @Effect()
  getUserInfo$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.GET_USER_INFO),
    map((action: userActions.GetUserInfo) => action.payload),
    switchMap(email =>
      from(this.fb.getUserInfo()).pipe(
        startWith(this.config.getUserInfo(email)),
        map(userInfo => new userActions.GetUserInfoSuccess(userInfo)),
        catchError(error => of(new userActions.GetUserInfoFailure(error)))
      )
    )
  );

  @Effect()
  logOut$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.LOG_OUT),
    switchMap(() =>
      from(this.fb.logout()).pipe(
        catchError(() => empty()),
        map(() => new userActions.GetUserEmail())
      )
    )
  );

  @Effect({ dispatch: false })
  saveState$ = this.actions$.pipe(
    ofType(userActions.GET_USER_INFO_SUCCESS),
    tap((action: userActions.GetUserInfoSuccess) => {
      if (action.payload) {
        this.config.setUserInfo(this.fb.getUserEmail(), action.payload);
      }
    })
  );

  @Effect({ dispatch: false })
  routeOnUser$ = this.actions$.pipe(
    ofType(userActions.SET_USER_EMAIL),
    map((action: userActions.SetUserEmail) => action.payload),
    tap(email => {
      this.ngZone.run(() => {
        if (email) {
          this.router.navigate(['home', '_']);
        } else {
          this.router.navigate(['login']);
        }
      });
    })
  );

  ngrxOnInitEffects(): Action {
    return new userActions.GetUserEmail();
  }
}
