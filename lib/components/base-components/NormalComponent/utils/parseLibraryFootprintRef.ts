import { isHttpUrl } from "./isHttpUrl"

/**
 * Parse a library-style footprint reference of the form "<lib>:<footprintName>".
 */
export const parseLibraryFootprintRef = (
  s: string,
): { footprintLib: string; footprintName: string } | null => {
  if (isHttpUrl(s)) return null
  const idx = s.indexOf(":")
  if (idx <= 0) return null
  const footprintLib = s.slice(0, idx)
  const footprintName = s.slice(idx + 1)
  if (!footprintLib || !footprintName) return null
  return { footprintLib, footprintName }
}
