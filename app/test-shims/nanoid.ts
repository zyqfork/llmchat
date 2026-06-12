let counter = 0;

export function nanoid() {
  counter += 1;
  return `test-id-${counter}`;
}
