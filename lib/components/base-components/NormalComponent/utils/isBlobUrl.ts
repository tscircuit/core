/**
 * Returns true if the string looks like a browser-managed Blob URL.
 */
export const isBlobUrl = (s: string): boolean => s.startsWith("blob:")
