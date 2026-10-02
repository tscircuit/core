import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

type PcbPrimitiveBounds = ReturnType<
  PrimitiveComponent["_getPcbBoundsBeforeLayout"]
>

/**
 * Returns matching bounds in the right-handed board-world PCB frame
 * (mm, +X right, +Y top, +Z above the board). Each primitive owns its geometry
 * and the transforms from its local frame into this shared frame.
 */
export function getPcbPrimitiveBoundsBeforeRender(
  primitive: PrimitiveComponent,
): PcbPrimitiveBounds | null {
  try {
    return primitive._getPcbBoundsBeforeLayout()
  } catch {
    return null
  }
}

export function doPcbPrimitivesOverlapBeforeRender(
  a: PrimitiveComponent,
  b: PrimitiveComponent,
): boolean {
  const aBounds = getPcbPrimitiveBoundsBeforeRender(a)
  const bBounds = getPcbPrimitiveBoundsBeforeRender(b)
  if (!aBounds || !bBounds) return false

  return !(
    aBounds.right < bBounds.left ||
    aBounds.left > bBounds.right ||
    aBounds.bottom > bBounds.top ||
    aBounds.top < bBounds.bottom
  )
}

export function isPcbPrimitiveContainedWithinBeforeRender(
  inner: PrimitiveComponent,
  outer: PrimitiveComponent,
): boolean {
  const innerBounds = getPcbPrimitiveBoundsBeforeRender(inner)
  const outerBounds = getPcbPrimitiveBoundsBeforeRender(outer)
  if (!innerBounds || !outerBounds) return false

  return (
    innerBounds.left >= outerBounds.left &&
    innerBounds.right <= outerBounds.right &&
    innerBounds.bottom >= outerBounds.bottom &&
    innerBounds.top <= outerBounds.top
  )
}

export function getConnectedPcbPrimitiveClustersBeforeRender(
  primitives: PrimitiveComponent[],
): PrimitiveComponent[][] {
  const clusters: PrimitiveComponent[][] = []
  const visited = new Set<PrimitiveComponent>()

  for (const primitive of primitives) {
    if (visited.has(primitive)) continue

    const cluster: PrimitiveComponent[] = []
    const stack = [primitive]
    visited.add(primitive)

    while (stack.length > 0) {
      const current = stack.pop()!
      cluster.push(current)

      for (const candidate of primitives) {
        if (visited.has(candidate)) continue
        if (!doPcbPrimitivesOverlapBeforeRender(current, candidate)) continue
        visited.add(candidate)
        stack.push(candidate)
      }
    }

    clusters.push(cluster)
  }

  return clusters
}
