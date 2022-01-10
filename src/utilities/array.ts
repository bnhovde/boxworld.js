export function equals(a: any[], b: any[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
