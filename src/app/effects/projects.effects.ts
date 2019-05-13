import { Injectable } from '@angular/core';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError, tap, startWith } from 'rxjs/operators';

import * as projectsActions from '../actions/projects.actions';
import * as userActions from '../actions/user.actions';
import { FirebaseToolsService } from '../providers/firebase-tools.service';
import { ElectronService } from '../providers/electron.service';

export type Action = projectsActions.All;

@Injectable()
export class ProjectsEffects {
  constructor(
    private actions$: Actions,
    private fb: FirebaseToolsService,
    private electron: ElectronService
  ) {}

  @Effect()
  getListOnUser$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.SET_USER_EMAIL),
    map((action: userActions.SetUserEmail) => action.payload),
    map(email => new projectsActions.GetList(email))
  );

  @Effect()
  getList$: Observable<Action> = this.actions$.pipe(
    ofType(projectsActions.GET_LIST),
    map((action: projectsActions.GetList) => action.payload),
    switchMap(email => {
      if (email) {
        return from(this.fb.getProjects()).pipe(
          startWith(this.electron.getCachedUserProjects(email)),
          map(list => new projectsActions.GetListSuccess(list)),
          catchError((error: Error) =>
            of(new projectsActions.GetListFailure(error))
          )
        );
      } else {
        return of(new projectsActions.GetListSuccess([]));
      }
    })
  );

  @Effect({ dispatch: false })
  saveState$ = this.actions$.pipe(
    ofType(projectsActions.GET_LIST_SUCCESS),
    tap((action: projectsActions.GetListSuccess) => {
      if (action.payload) {
        const configUserInfo = this.electron.configGet('userprojects', {});
        configUserInfo[this.fb.getUserEmail()] = action.payload;
        this.electron.configSet('userprojects', configUserInfo);
      }
    })
  );
}
