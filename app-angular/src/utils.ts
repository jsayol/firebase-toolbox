import * as AnsiUp from 'ansi_up';

const ansiUp: AnsiUp.AnsiUp = new (AnsiUp as any).default();
ansiUp.use_classes = true;

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
