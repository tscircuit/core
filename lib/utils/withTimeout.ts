/**
 * Resolve with `promise`, or with `fallback` if it has not settled within `ms`.
 * The timer is always cleared, so it never keeps the process alive.
 */
export const withTimeout = <T, F>(
  promise: Promise<T>,
  ms: number,
  fallback: F,
): Promise<T | F> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<F>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms)
  })
  return Promise.race([promise, timedOut]).finally(() => clearTimeout(timer))
}
