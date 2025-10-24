/**
 * Returns true if the string looks like an http(s) URL.
 */
export const isHttpUrl = (s: string): boolean =>
  s.startsWith("http://") || s.startsWith("https://")
