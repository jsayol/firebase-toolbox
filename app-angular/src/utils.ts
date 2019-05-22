import { AbstractControl } from '@angular/forms';
import * as AnsiUp from 'ansi_up';

const ansiUp: AnsiUp.AnsiUp = new (AnsiUp as any).default();
ansiUp.use_classes = true;

export const CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';

export const CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

export function ansiToHTML(text: string): string {
  return ansiUp.ansi_to_html(text);
}

export function getRandomId(): string {
  const ID_LENGTH = 15;

  let id = '';
  do {
    id += Math.random()
      .toString(36)
      .substr(2);
  } while (id.length < ID_LENGTH);

  id = id.substr(0, ID_LENGTH);

  return id;
}

export function contains(obj: { [k: string]: any }, prop: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function ifNotEmpty<T = any>(
  value: T
): Exclude<Exclude<T, ''>, null> | undefined {
  if ((value as any) === '' || value === null) {
    return;
  }

  return value as any;
}

export function databasePathValidator(
  control: AbstractControl
): { [key: string]: any } | null {
  if (typeof control.value === 'string' && control.value.startsWith('/')) {
    return null;
  } else {
    return { path: 'Path must begin with /' };
  }
}
