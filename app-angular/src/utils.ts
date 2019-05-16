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
