/**
 * Returns true if the string looks like an http(s) URL.
 */
export const isFootprintUrl = (s: string): boolean =>
  s.startsWith("http://") || s.startsWith("https://")

/**
 * Parse a library-style footprint reference of the form "<lib>:<footprintName>".
 */
export const parseLibraryFootprintRef = (
  s: string,
): { footprintLib: string; footprintName: string } | null => {
  if (isFootprintUrl(s)) return null
  const idx = s.indexOf(":")
  if (idx <= 0) return null
  const footprintLib = s.slice(0, idx)
  const footprintName = s.slice(idx + 1)
  if (!footprintLib || !footprintName) return null
  return { footprintLib, footprintName }
}
