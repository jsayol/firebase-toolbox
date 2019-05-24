import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { takeWhile } from 'rxjs/operators';
import * as inquirer_Type from 'inquirer';

import { PromptService, PromptQuestion } from '../../providers/prompt.service';

const REPLACE_IN_MESSAGE = [
  [' Press Space to select features, then Enter to confirm your choices.', ''],
  [
    '\u001b[1m\u001b[33m\u001b[4mTHE ENTIRE DATABASE', // ansi bright yellow
    '\u001b[1m\u001b[31m\u001b[4mTHE ENTIRE DATABASE' // ansi bright red
  ]
];

function checkboxToAnswer(question: PromptQuestion['question']): boolean[] {
  return (question.choices as (
    | string
    | inquirer_Type.objects.ChoiceOption)[]).map(choice =>
    typeof choice === 'string' ? false : choice.checked
  );
}

function answerToCheckbox(
  question: PromptQuestion['question'],
  answer: boolean[]
): string[] {
  return (question.choices as (string | inquirer_Type.objects.ChoiceOption)[])
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

      // Question type "checkbox" needs to be handled as a special case.
      // See https://github.com/SBoudrias/Inquirer.js#checkbox---type-checkbox
      if (this.question.type === 'checkbox') {
        this.checkboxAnswer = checkboxToAnswer(this.question);
      } else {
        this.answer = this.question.default;
      }

      // Remove certain choices from "list" when running "init"
      if (this.question.name === 'id' && this.question.type === 'list') {
        this.question.choices = (this.question.choices as any[]).filter(
          choice =>
            choice !== '[create a new project]' &&
            choice !== '[don\'t setup a default project]'
        );
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

  getListChoiceName(
    choice: string | inquirer_Type.objects.ChoiceOption
  ): string {
    return typeof choice === 'string' ? choice : choice.name;
  }

  getListChoiceValue(
    choice: string | inquirer_Type.objects.ChoiceOption
  ): string {
    return typeof choice === 'string' ? choice : choice.value;
  }

  getListChoiceDisabled(
    choice: string | inquirer_Type.objects.ChoiceOption
  ): boolean {
    return typeof choice === 'string' ? false : !!choice.disabled;
  }
}
