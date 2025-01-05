import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export const areAllPcbPrimitivesOverlapping = (
  pcbPrimitives: PrimitiveComponent[],
): boolean => {
  if (pcbPrimitives.length <= 1) return true

  // Get bounds of all primitives
  const bounds = pcbPrimitives.map((p) => {
    const circuitBounds = p._getPcbCircuitJsonBounds()
    return {
      left: circuitBounds.bounds.left,
      right: circuitBounds.bounds.right,
      top: circuitBounds.bounds.top,
      bottom: circuitBounds.bounds.bottom,
    }
  })

  // Check each primitive against every other primitive
  for (let i = 0; i < bounds.length; i++) {
    for (let j = i + 1; j < bounds.length; j++) {
      const a = bounds[i]
      const b = bounds[j]

      // Check if bounding boxes overlap
      const overlap = !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom > b.top ||
        a.top < b.bottom
      )

      if (!overlap) return false
    }
  }

  return true
}
