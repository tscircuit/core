interface Point {
  x: number
  y: number
}

interface Edge {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface AxisAlignedRect {
  x: number
  y: number
  width: number
  height: number
}

const xAt = (edge: Edge, y: number) =>
  edge.x1 + ((y - edge.y1) * (edge.x2 - edge.x1)) / (edge.y2 - edge.y1)

/**
 * Decomposes a simple polygon into axis-aligned rectangles that are fully
 * contained within it. Rectilinear polygons are tiled exactly; a slanted
 * edge contributes the tighter of its positions at the two slab boundaries,
 * so no rectangle ever extends outside the polygon. Rectangles narrower
 * than minRectDimension on either axis are dropped after merging.
 */
export function decomposePolygonIntoAxisAlignedRects(
  points: Point[],
  { minRectDimension = 0 }: { minRectDimension?: number } = {},
): AxisAlignedRect[] {
  if (points.length < 3) return []

  const edges: Edge[] = []
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]!
    const p2 = points[(i + 1) % points.length]!
    if (p1.y !== p2.y) {
      edges.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
    }
  }
  if (edges.length === 0) return []

  const slabYs = Array.from(new Set(points.map((p) => p.y))).sort(
    (a, b) => a - b,
  )

  interface Span {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
  }
  const spans: Span[] = []
  let previousSlabSpans: Span[] = []

  for (let i = 0; i < slabYs.length - 1; i++) {
    const yBottom = slabYs[i]!
    const yTop = slabYs[i + 1]!
    const yMid = (yBottom + yTop) / 2

    const spanningEdges = edges.filter(
      (e) => Math.min(e.y1, e.y2) <= yBottom && Math.max(e.y1, e.y2) >= yTop,
    )
    spanningEdges.sort((a, b) => xAt(a, yMid) - xAt(b, yMid))

    const slabSpans: Span[] = []
    for (let k = 0; k + 1 < spanningEdges.length; k += 2) {
      const left = spanningEdges[k]!
      const right = spanningEdges[k + 1]!
      const xMin = Math.max(xAt(left, yBottom), xAt(left, yTop))
      const xMax = Math.min(xAt(right, yBottom), xAt(right, yTop))
      // a wedge closing onto a slab boundary leaves a float-noise-wide span
      if (xMax - xMin <= 1e-12) continue

      const continuation = previousSlabSpans.find(
        (s) =>
          s.yMax === yBottom &&
          Math.abs(s.xMin - xMin) < 1e-9 &&
          Math.abs(s.xMax - xMax) < 1e-9,
      )
      if (continuation) {
        continuation.yMax = yTop
        slabSpans.push(continuation)
      } else {
        const span = { xMin, xMax, yMin: yBottom, yMax: yTop }
        spans.push(span)
        slabSpans.push(span)
      }
    }
    previousSlabSpans = slabSpans
  }

  return spans
    .filter(
      (s) =>
        s.xMax - s.xMin >= minRectDimension &&
        s.yMax - s.yMin >= minRectDimension,
    )
    .map((s) => ({
      x: (s.xMin + s.xMax) / 2,
      y: (s.yMin + s.yMax) / 2,
      width: s.xMax - s.xMin,
      height: s.yMax - s.yMin,
    }))
}
