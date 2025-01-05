import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export const areAllPcbPrimitivesOverlapping = (
  pcbPrimitives: PrimitiveComponent[],
): boolean => {
  if (pcbPrimitives.length <= 1) return true
  return false
  // TODO
}
