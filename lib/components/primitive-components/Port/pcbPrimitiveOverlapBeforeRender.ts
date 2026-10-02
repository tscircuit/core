import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { SmtPad } from "../SmtPad"
import { applyToPoint } from "transformation-matrix"

type PcbPrimitiveBounds = {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Returns axis-aligned bounds in board space (mm, +X right, +Y up).
 * Polygon vertices are pad-local points and must include the pad's complete
 * transform, including translation, rotation and the footprint layer flip.
 */
export function getPcbPrimitiveBoundsBeforeRender(
  primitive: PrimitiveComponent,
): PcbPrimitiveBounds | null {
  try {
    if (primitive.componentName === "SmtPad") {
      const { _parsedProps: padProps } = primitive as SmtPad
      if (padProps.shape === "polygon") {
        // Use the same transform as SmtPad.doInitialPcbPrimitiveRender: a
        // polygon's origin is not necessarily the center of its vertices.
        const padToBoardTransform =
          primitive._computePcbGlobalTransformBeforeLayout()
        const boardPoints = padProps.points.map((point) =>
          applyToPoint(padToBoardTransform, point),
        )
        return {
          left: Math.min(...boardPoints.map((point) => point.x)),
          right: Math.max(...boardPoints.map((point) => point.x)),
          top: Math.max(...boardPoints.map((point) => point.y)),
          bottom: Math.min(...boardPoints.map((point) => point.y)),
        }
      }
    }
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
