import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { PromptService, PromptQuestion } from '../../providers/prompt.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-prompt-modal',
  templateUrl: './prompt-modal.component.html',
  styleUrls: ['./prompt-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromptModalComponent implements OnInit, OnDestroy {
  open = false;
  question: PromptQuestion['question'] | null = null;
  answer = '';

  private currentId: PromptQuestion['id'] | null = null;

  private destroy = false;
  private buffer: PromptQuestion[] = [];

  constructor(
    private prompt: PromptService,
    private ngZone: NgZone,
    private changeDetRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.prompt.questions$
      .pipe(takeWhile(() => this.destroy === false))
      .subscribe(question => {
        if (this.currentId) {
          this.buffer.push(question);
        } else {
          this.showQuestion(question);
        }
      });
  }

  ngOnDestroy() {
    this.destroy = true;
  }

  showQuestion(question: PromptQuestion): void {
    this.ngZone.run(() => {
      this.currentId = question.id;
      this.question = question.question;

      if (this.question.type === 'input') {
        this.answer = this.question.default;
      }

      this.open = true;
      this.changeDetRef.markForCheck();
    });
  }

  continue() {
    this.prompt.answer(this.currentId, this.answer);
    this.currentId = null;
    this.question = null;
    this.answer = '';

    if (this.buffer.length > 0) {
      this.showQuestion(this.buffer.shift());
    } else {
      this.open = false;
    }
  }

  cancel() {
    this.prompt.answer(this.currentId, undefined, true);
    this.open = false;
    this.buffer = [];
    this.currentId = null;
    this.question = null;
  }
}
