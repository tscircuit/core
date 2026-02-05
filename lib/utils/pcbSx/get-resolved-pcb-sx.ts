import type { PcbSx, PcbStyle } from "@tscircuit/props"
import { convertPcbStyleToPcbSx } from "./convert-pcb-style-to-pcb-sx"

/**
 * Builds a resolved PcbSx by merging:
 *   parentResolvedPcbSx < pcbStyle-as-pcbSx < ownPcbSx
 *
 * Later sources override earlier ones at the per-selector-property level.
 */
export function getResolvedPcbSx({
  parentResolvedPcbSx,
  pcbStyle,
  ownPcbSx,
}: {
  parentResolvedPcbSx?: PcbSx
  pcbStyle?: PcbStyle
  ownPcbSx?: PcbSx
}): PcbSx {
  const styleSx = convertPcbStyleToPcbSx(pcbStyle)

  const result: PcbSx = {}

  // Collect all selector keys from all sources
  const allKeys = new Set<string>()
  if (parentResolvedPcbSx) {
    for (const k of Object.keys(parentResolvedPcbSx)) allKeys.add(k)
  }
  if (styleSx) {
    for (const k of Object.keys(styleSx)) allKeys.add(k)
  }
  if (ownPcbSx) {
    for (const k of Object.keys(ownPcbSx)) allKeys.add(k)
  }

  for (const key of allKeys) {
    result[key] = {
      ...parentResolvedPcbSx?.[key],
      ...styleSx?.[key],
      ...ownPcbSx?.[key],
    }
  }

  return result
}
