import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DomSanitizer } from '@angular/platform-browser';

import {
  DatabaseAlterBase,
  OperationType
} from '../alter-base/database-alter.base';
import { FirebaseToolsService } from '../../../../providers/firebase-tools.service';
import { ElectronService } from '../../../../providers/electron.service';
import { AppState } from '../../../../models';

@Component({
  selector: 'app-database-remove-section',
  templateUrl: '../alter-base/database-alter.base.html',
  styleUrls: ['../alter-base/database-alter.base.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class DatabaseRemoveSectionComponent extends DatabaseAlterBase {
  public operation = OperationType.Remove;
  public info = 'Remove data from the database.';

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
