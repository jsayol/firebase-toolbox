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

const REPLACE_IN_MESSAGE = [
  [' Press Space to select features, then Enter to confirm your choices.', '']
];

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
      // TODO: question type "checkbox" needs to be handled as a special
      // case ("default" is an array, choices might have {checked:true}, etc.)
      // See https://github.com/SBoudrias/Inquirer.js#checkbox---type-checkbox

      if (typeof question.question.message === 'string') {
        for (const [pattern, value] of REPLACE_IN_MESSAGE) {
          question.question.message = question.question.message.replace(
            pattern,
            value
          );
        }
      }

      this.currentId = question.id;
      this.question = question.question;
      this.answer = this.question.default;
      this.open = true;
      this.changeDetRef.markForCheck();
    });
  }

  continue() {
    const id = this.currentId;
    const answer = this.answer;

    this.currentId = null;
    this.question = null;
    this.answer = '';

    this.prompt.answer(id, answer);

    if (this.buffer.length > 0) {
      this.showQuestion(this.buffer.shift());
    } else {
      this.open = false;
    }
  }

  cancel() {
    const id = this.currentId;

    this.open = false;
    this.buffer = [];
    this.currentId = null;
    this.question = null;

    this.prompt.answer(id, undefined, true);
  }
}
