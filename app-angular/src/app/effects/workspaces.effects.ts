import { Injectable } from '@angular/core';
import { Effect, Actions, ofType, OnInitEffects } from '@ngrx/effects';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import * as workspacesActions from '../actions/workspaces.actions';
import { FirebaseToolsService } from '../providers/firebase-tools.service';

export type Action = workspacesActions.All;

@Injectable()
export class WorkspacesEffects implements OnInitEffects {
  constructor(private actions$: Actions, private fb: FirebaseToolsService) {}

  @Effect()
  getList$: Observable<Action> = this.actions$.pipe(
    ofType(workspacesActions.GET_LIST),
    switchMap(() =>
      from(this.fb.getWorkspaces()).pipe(
        map(list => new workspacesActions.GetListSuccess(list))
      )
    )
  );

  ngrxOnInitEffects(): Action {
    return new workspacesActions.GetList();
  }
}
