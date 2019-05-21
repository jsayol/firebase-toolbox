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
import { objects as inquirerObjects } from 'inquirer';

const REPLACE_IN_MESSAGE = [
  [' Press Space to select features, then Enter to confirm your choices.', '']
];

function checkboxToAnswer(question: PromptQuestion['question']): boolean[] {
  return (question.choices as (string | inquirerObjects.ChoiceOption)[]).map(
    choice => (typeof choice === 'string' ? false : choice.checked)
  );
}

function answerToCheckbox(
  question: PromptQuestion['question'],
  answer: boolean[]
): string[] {
  return (question.choices as (string | inquirerObjects.ChoiceOption)[])
    .map((choice, index) => {
      if (!answer[index]) {
        return null;
      }
      return typeof choice === 'string' ? choice : choice.name;
    })
    .filter(choice => choice !== null);
}

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
  checkboxAnswer: boolean[] = [];

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

      if (typeof this.question.message === 'string') {
        for (const [pattern, value] of REPLACE_IN_MESSAGE) {
          this.question.message = this.question.message.replace(pattern, value);
        }
      }

      // TODO: question type "checkbox" needs to be handled as a special
      // case ("default" is an array, choices might have {checked:true}, etc.)
      // See https://github.com/SBoudrias/Inquirer.js#checkbox---type-checkbox
      if (this.question.type === 'checkbox') {
        this.checkboxAnswer = checkboxToAnswer(this.question);
      } else {
        this.answer = this.question.default;
      }

      this.open = true;
      this.changeDetRef.markForCheck();
    });
  }

  continue() {
    const id = this.currentId;
    const answer =
      this.question.type === 'checkbox'
        ? answerToCheckbox(this.question, this.checkboxAnswer)
        : this.answer;

    this.currentId = null;
    this.question = null;
    this.answer = '';
    this.checkboxAnswer = [];

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
