/**
 * Returns true if the string looks like an http(s) URL.
 */
export const isFootprintUrl = (s: string): boolean =>
  s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")
