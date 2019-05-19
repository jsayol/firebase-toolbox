import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {
  Validators,
  FormBuilder,
  FormControl,
  FormArray,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';

import { FirebaseToolsService } from '../../../providers/firebase-tools.service';

function minTargetsValidator(minChecked = 1): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    console.log(control);
    const numChecked = (control.value as boolean[]).reduce(
      (sum, checked) => (checked ? sum + 1 : sum),
      0
    );
    return numChecked >= minChecked
      ? null
      : { targets: 'Select at least one target' };
  };
}

@Component({
  selector: 'app-serve-section',
  templateUrl: './serve-section.component.html',
  styleUrls: ['./serve-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-module]': 'true'
  }
})
export class ServeSectionComponent implements OnInit {
  serveRunning = false;

  targets: Array<{ name: string; value: string; checked: boolean }> = [
    { name: 'Hosting', value: 'hosting', checked: true },
    { name: 'Functions', value: 'functions', checked: true },
    { name: 'Firestore', value: 'firestore', checked: false },
    { name: 'Database', value: 'database', checked: false }
  ];

  form = this.formBuilder.group({
    // host: ['', Validators.required],
    host: [''],
    port: ['', Validators.compose([Validators.min(1), Validators.max(65535)])],
    targets: this.formBuilder.array(
      this.targets.map(t => t.checked),
      minTargetsValidator(1)
    )
  });

  constructor(
    private fb: FirebaseToolsService,
    private formBuilder: FormBuilder
  ) {}

  get formTargets(): FormArray {
    return this.form.get('targets') as FormArray;
    // return { controls: [true, true, false, false] } as any;
  }

  ngOnInit() {}

  toggleServe(): void {
    this.serveRunning = !this.serveRunning;
  }
}
