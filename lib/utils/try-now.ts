export function tryNow<T>(fn: () => T): [T, null] | [null, Error] {
  try {
    return [fn(), null]
  } catch (e: any) {
    return [null, e]
  }
}
