/**
 * Return pairs of adjacent elements in an array.
 */
export function pairs<T>(arr: Array<T>): Array<[T, T]> {
  const result: Array<[T, T]> = []
  for (let i = 0; i < arr.length - 1; i++) {
    result.push([arr[i], arr[i + 1]])
  }
  return result
}
