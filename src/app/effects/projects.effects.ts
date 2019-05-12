import { Injectable } from '@angular/core';
import { Effect, Actions, ofType, OnInitEffects } from '@ngrx/effects';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import * as projectsActions from '../actions/projects.actions';
import { FirebaseToolsService } from '../providers/firebase-tools.service';

export type Action = projectsActions.All;

@Injectable()
export class ProjectsEffects implements OnInitEffects {
  constructor(private actions$: Actions, private fb: FirebaseToolsService) {}

  @Effect()
  getList$: Observable<Action> = this.actions$.pipe(
    ofType(projectsActions.GET_LIST),
    switchMap(() =>
      from(this.fb.getProjects()).pipe(
        map(list => new projectsActions.GetListSuccess(list)),
        catchError((error: Error) =>
          of(new projectsActions.GetListFailure(error))
        )
      )
    )
  );

  ngrxOnInitEffects(): Action {
    return new projectsActions.GetList();
  }
}
