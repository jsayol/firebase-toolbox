import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import {
  FirebaseToolsService,
  Workspace
} from '../../../providers/firebase-tools.service';
import { AppState } from '../../../models';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-settings-module',
  templateUrl: './settings-module.component.html',
  styleUrls: ['./settings-module.component.scss']
})
export class SettingsModuleComponent implements OnInit {
  constructor(
    private store: Store<AppState>,
    private fb: FirebaseToolsService
  ) {}

  ngOnInit() {}

  init() {
    const workspace$: Observable<Workspace | null> = this.store.select(
      'workspaces',
      'selected'
    );
    workspace$.pipe(first()).subscribe(async workspace => {
      try {
        const resp = await this.fb.init(workspace.path, 'firestore');
        console.log('Init done!', { resp });
      } catch (err) {
        console.log('Init error!', err);
      }
    });
  }
}
