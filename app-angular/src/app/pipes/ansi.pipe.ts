import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { ansiToHTML } from '../../utils';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'ansi'
})
export class AnsiPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: any, safeHtml = true): SafeHtml {
    const html = ansiToHTML(value);

    if (safeHtml) {
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } else {
      return this.sanitizer.sanitize(SecurityContext.HTML, html);
    }
  }
}
