import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DomSanitizer } from '@angular/platform-browser';

import { DatabaseSetUpdateBase } from '../set-update-base/database-set-update.base';
import { FirebaseToolsService } from '../../../../providers/firebase-tools.service';
import { ElectronService } from '../../../../providers/electron.service';
import { AppState } from '../../../../models';

@Component({
  selector: 'app-database-set-section',
  templateUrl: '../set-update-base/database-set-update.base.html',
  styleUrls: ['../set-update-base/database-set-update.base.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class DatabaseSetSectionComponent extends DatabaseSetUpdateBase {
  public operation: 'set' = 'set';
  public info = 'Store JSON data in the database.';

  constructor(
    changeDetRef: ChangeDetectorRef,
    formBuilder: FormBuilder,
    store: Store<AppState>,
    fb: FirebaseToolsService,
    sanitizer: DomSanitizer,
    electron: ElectronService
  ) {
    super(changeDetRef, formBuilder, store, fb, sanitizer, electron);
  }
}
