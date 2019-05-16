import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Question } from 'inquirer';

import { getRandomId } from '../../utils';
import { filter, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PromptService {
  questions$ = new Subject<{ id: string; question: Question }>();
  answers$ = new Subject<{ id: string; error?: any; answer: string }>();

  show(question: Question): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = getRandomId();

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
}
