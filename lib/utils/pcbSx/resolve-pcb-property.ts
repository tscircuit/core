import type { PcbSx } from "@tscircuit/props"

/**
 * Resolves a single property from a PcbSx record for a given path.
 *
 * @param propertyName - The property to look up (e.g. "fontSize")
 * @param resolvedPcbSx - The merged PcbSx from the ancestor chain
 * @param pathFromAmpersand - The selector path to match (e.g. "silkscreentext")
 */
export function resolvePcbProperty({
  propertyName,
  resolvedPcbSx,
  pathFromAmpersand,
}: {
  propertyName: string
  resolvedPcbSx: PcbSx | undefined
  pathFromAmpersand: string
}): number | string | undefined {
  if (!resolvedPcbSx) return undefined

  // Try exact match with "& <path>"
  const key = `& ${pathFromAmpersand}`
  const entry = resolvedPcbSx[key]
  if (entry && propertyName in entry) {
    return (entry as any)[propertyName]
  }

  return undefined
}
