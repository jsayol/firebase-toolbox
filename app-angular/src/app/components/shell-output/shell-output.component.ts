import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ResizeEvent } from 'angular-resizable-element';
import * as linkify from 'linkify-urls';

import { ansiToHTML } from '../../../utils';

@Component({
  selector: 'app-shell-output',
  templateUrl: './shell-output.component.html',
  styleUrls: ['./shell-output.component.scss'],
  host: {
    '[class.visible]': 'isVisible',
    '[style.top]': 'isOpen ? hostTop : "calc(100vh - 6.3rem)"',
    '[style.transition]': 'isResizing ? none : "top 0.1s ease-in-out 0s"'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellOutputComponent implements OnInit {
  isVisible = false;
  isOpen = false;
  safeOutput: SafeHtml = '';
  hostTop = '40vh';
  isResizing = false;

  @ViewChild('outputRef', { static: true })
  outputRef: ElementRef;

  private unsafedOutput = '';

  constructor(
    private changeDetRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
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
      setTimeout(() => {
        const element: HTMLElement = this.outputRef.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, delay);
    }
  }

  show() {
    this.isVisible = true;
    this.changeDetRef.markForCheck();
  }

  open() {
    this.isOpen = true;
    this.isVisible = true;
    this.changeDetRef.markForCheck();
  }

  clear() {
    this.safeOutput = '';
    this.unsafedOutput = '';
  }

  onResizeEnd(event: ResizeEvent): void {
    this.isResizing = true;
    this.hostTop = `${event.rectangle.top - 127}px`;
    setImmediate(() => {
      this.ngZone.run(() => {
        this.isResizing = false;
      });
    });
  }

  private add(text: string): void {
    this.ngZone.run(() => {
      this.unsafedOutput += linkify(ansiToHTML(text));
      this.safeOutput = this.sanitizer.bypassSecurityTrustHtml(
        this.unsafedOutput
      );
      this.changeDetRef.markForCheck();
      this.scrolltoBottom();
    });
  }
}
