import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { FirebaseToolsService } from '../../providers/firebase-tools.service';
import { AppState } from '../../models';
import * as userActions from '../../actions/user.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  showLoginModal = false;

  constructor(
    private fb: FirebaseToolsService,
    private store: Store<AppState>
  ) {}

  async login() {
    try {
      // TODO: Ask the user if they want to allow usage collection
      this.showLoginModal = true;
      await this.fb.login({ localhost: true, collectUsage: 'no' });
      this.showLoginModal = false;
      this.store.dispatch(new userActions.GetUserEmail());
    } catch (err) {
      // TODO: show error
      console.warn(err);
    }
  }

  cancelLoginModal() {
    this.showLoginModal = false;
  }
}
