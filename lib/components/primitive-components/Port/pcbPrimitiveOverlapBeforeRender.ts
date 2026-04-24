import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

type PcbPrimitiveBounds = {
  left: number
  right: number
  top: number
  bottom: number
}

export function getPcbPrimitiveBoundsBeforeRender(
  primitive: PrimitiveComponent,
): PcbPrimitiveBounds | null {
  try {
    const center = primitive._getGlobalPcbPositionBeforeLayout()
    const size = primitive.getPcbSize()
    return {
      left: center.x - size.width / 2,
      right: center.x + size.width / 2,
      top: center.y + size.height / 2,
      bottom: center.y - size.height / 2,
    }
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
