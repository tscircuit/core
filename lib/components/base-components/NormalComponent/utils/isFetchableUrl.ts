/**
 * Returns true if the string looks like a fetchable URL.
 * Includes http://, https://, file://, and blob:// protocols.
 */
export const isFetchableUrl = (s: string): boolean =>
  s.startsWith("http://") ||
  s.startsWith("https://") ||
  s.startsWith("file://") ||
  s.startsWith("blob:")
