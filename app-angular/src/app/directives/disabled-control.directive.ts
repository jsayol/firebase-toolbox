import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[disabledControl]'
})
export class DisabledControlDirective {
  @Input() set disabledControl(condition: boolean) {
    const action = condition ? 'disable' : 'enable';
    this.ngControl.control[action]();
  }

  constructor(private ngControl: NgControl) {}
}
