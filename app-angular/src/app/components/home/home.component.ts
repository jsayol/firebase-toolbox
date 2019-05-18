import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { Workspace } from '../../models/workspaces.model';
import { AppState } from '../../models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  workspace$: Observable<Workspace | null> = this.store.select(
    'workspaces',
    'selected'
  );

  constructor(private store: Store<AppState>) {}
}
