export default function Factory<T>(c: { new (): T }): T {
  return new c();
}
