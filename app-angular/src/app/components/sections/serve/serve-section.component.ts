import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import {
  Validators,
  FormBuilder,
  FormArray,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';

import { FirebaseToolsService } from '../../../providers/firebase-tools.service';
import { ShellOutputComponent } from '../../shell-output/shell-output.component';
import { OutputCapture } from '../../../providers/electron.service';
import { InitFeatureName } from 'firebase-tools';
import { Store } from '@ngrx/store';
import { AppState } from '../../../models';
import { first } from 'rxjs/operators';

function minTargetsValidator(minChecked = 1): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
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

  targets: Array<{ name: string; value: InitFeatureName; checked: boolean }> = [
    { name: 'Hosting', value: 'hosting', checked: true },
    { name: 'Functions', value: 'functions', checked: true },
    { name: 'Firestore', value: 'firestore', checked: false },
    { name: 'Database', value: 'database', checked: false }
  ];

  form = this.formBuilder.group({
    // host: ['', Validators.required],
    host: ['localhost'],
    port: [
      '5000',
      Validators.compose([Validators.min(1), Validators.max(65535)])
    ],
    targets: this.formBuilder.array(
      this.targets.map(t => t.checked),
      minTargetsValidator()
    )
  });

  @ViewChild(ShellOutputComponent)
  shellOutput!: ShellOutputComponent;

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private store: Store<AppState>,
    private fb: FirebaseToolsService,
    private formBuilder: FormBuilder
  ) {}

  get formTargets(): FormArray {
    return this.form.get('targets') as FormArray;
  }

  ngOnInit() {}

  startServe(): void {
    const output: OutputCapture = {
      stdout: text => {
        console.log('Logging stdout:', text);
        this.shellOutput.stdout(text);
      },
      stderr: text => {
        console.log('Logging stderr:', text);
        this.shellOutput.stderr(text);
      }
    };

    const { host, port, targets: targetsCheck } = this.form.value;
    const targets: InitFeatureName[] = (targetsCheck as boolean[])
      .map((checked, i) => (checked ? this.targets[i].value : null))
      .filter(target => target !== null);

    this.serveRunning = true;
    this.shellOutput.clear();
    this.shellOutput.show();
    this.shellOutput.open();
    this.changeDetRef.markForCheck();

    const serve = async () => {
      const workspace = await this.store
        .select('workspaces', 'selected')
        .pipe(first())
        .toPromise();

      try {
        const resp = await this.fb.serve(
          output,
          workspace.path,
          targets,
          host === '' ? undefined : host,
          port === '' ? undefined : port
        );
        console.log('Serve done:', resp);
      } catch (err) {
        console.log('Serve error:', err);
      }

      this.serveRunning = false;
      this.changeDetRef.markForCheck();
    };

    serve();
  }

  stopServe(): void {
    // TODO. This will require making changes to sendAndWait() to be able to
    // send a kill command to the child process.
  }
}
