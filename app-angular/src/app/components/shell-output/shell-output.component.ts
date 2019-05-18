import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ansiToHTML } from '../../../utils';

@Component({
  selector: 'app-shell-output',
  templateUrl: './shell-output.component.html',
  styleUrls: ['./shell-output.component.scss'],
  host: { '[class.visible]': 'isVisible' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellOutputComponent implements OnInit {
  isVisible = false;
  isOpen = false;
  safeOutput: SafeHtml = '';

  @ViewChild('outputRef')
  outputRef: ElementRef;

  private unsafedOutput = '';

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {}

  toggle() {
    this.isOpen = !this.isOpen;
  }

  stdout(text: string): void {
    this.add(text);
  }

  stderr(text: string): void {
    this.show();
    this.add(text);
  }

  scrolltoBottom(delay = 0) {
    if (this.isOpen) {
      // TODO: only scroll if the user hasn't manually scrolled up
      setTimeout(() => {
        const element: HTMLElement = this.outputRef.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, delay);
    }
  }

  show() {
    this.isVisible = true;
  }

  open() {
    this.isOpen = true;
  }

  clear() {
    this.safeOutput = '';
    this.unsafedOutput = '';
  }

  private add(text: string): void {
    this.unsafedOutput += ansiToHTML(text);
    this.safeOutput = this.sanitizer.bypassSecurityTrustHtml(
      this.unsafedOutput
    );
    this.changeDetRef.markForCheck();
    this.show();
    this.scrolltoBottom();
  }
}
