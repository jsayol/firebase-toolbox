import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, first } from 'rxjs/operators';

// Just types!
import * as inquirer_Type from 'inquirer';

export interface PromptQuestion {
  id: string;
  question: inquirer_Type.Question;
}

export interface PromptAnswer {
  id: string;
  answer?: string | string[];
  error?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PromptService {
  questions$ = new Subject<PromptQuestion>();
  private answers$ = new Subject<PromptAnswer>();

  show(
    id: string,
    question: inquirer_Type.Question
  ): Promise<string | string[]> {
    return new Promise((resolve, reject) => {
      this.answers$
        .pipe(
          filter(value => value.id === id),
          first()
        )
        .subscribe(answer => {
          if (answer.error) {
            reject(answer.error);
          } else {
            resolve(answer.answer);
          }
        });

      this.questions$.next({ id, question });
    });
  }

  answer(id, answer: string | string[] | undefined, error?: any): void {
    this.answers$.next({ id, answer, error });
  }
}
