import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Question } from 'inquirer';

import { getRandomId } from '../../utils';
import { filter, first } from 'rxjs/operators';

export interface PromptQuestion {
  id: string;
  question: Question;
}

export interface PromptAnswer {
  id: string;
  answer?: string;
  error?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PromptService {
  questions$ = new Subject<PromptQuestion>();
  private answers$ = new Subject<PromptAnswer>();

  show(id: string, question: Question): Promise<string> {
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

  answer(id, answer: string | undefined, error?: any): void {
    this.answers$.next({ id, answer, error });
  }
}
