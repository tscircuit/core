import type { Bounds } from "@tscircuit/math-utils"

interface Point {
  x: number
  y: number
}

interface Rect {
  center: { x: number; y: number }
  width: number
  height: number
}

/**
 * Fills a polygon with axis-aligned rectangles using a scanline algorithm.
 * This is a simple implementation and may not be perfect for all complex
 * self-intersecting polygons, but it works for simple concave/convex shapes.
 * Points and returned rectangles are in board world mm (+X right, +Y up,
 * right-handed +Z above). Full coverage is opt-in for nonconductive cutouts;
 * the default midpoint approximation is retained for pads and copper pours.
 */
export function fillPolygonWithRects(
  polygon: Point[],
  options: {
    rectHeight?: number
    /** Cover the entire simple ring, allowing at most rectHeight / 2 side overhang. */
    fullCoverage?: boolean
  } = {},
): Rect[] {
  if (polygon.length < 3) return []

  const { rectHeight = 0.1, fullCoverage = false } = options
  if (fullCoverage) return fillPolygonWithFullCoverage(polygon, rectHeight)

  const rects: Rect[] = []

  const yCoords = polygon.map((p) => p.y)
  const minY = Math.min(...yCoords)
  const maxY = Math.max(...yCoords)

  for (let y = minY; y < maxY; y += rectHeight) {
    const scanlineY = y + rectHeight / 2
    const intersections: number[] = []

    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i]
      const p2 = polygon[(i + 1) % polygon.length]

      // Check if the scanline intersects with the edge
      if (
        (p1.y <= scanlineY && p2.y > scanlineY) ||
        (p2.y <= scanlineY && p1.y > scanlineY)
      ) {
        // Calculate intersection point
        const x = ((scanlineY - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y) + p1.x
        intersections.push(x)
      }
    }

    intersections.sort((a, b) => a - b)

    for (let i = 0; i < intersections.length; i += 2) {
      if (i + 1 < intersections.length) {
        const x1 = intersections[i]
        const x2 = intersections[i + 1]
        const width = x2 - x1
        if (width > 1e-6) {
          // Avoid creating zero-width rects
          rects.push({
            center: {
              x: x1 + width / 2,
              y: scanlineY,
            },
            width,
            height: rectHeight,
          })
        }
      }
    }
  }

  return rects
}

/**
 * Split at vertex heights so edge pairing stays constant in each band. Cover
 * both ends of each edge, subdividing to limit overhang, then merge identical
 * adjacent spans. Holes and self-intersecting rings are not supported.
 */
function fillPolygonWithFullCoverage(
  polygon: Point[],
  rectHeight: number,
): Rect[] {
  if (!Number.isFinite(rectHeight) || rectHeight <= 0) return []
  const maxSideOverhang = rectHeight / 2

  const vertexHeights = [...new Set(polygon.map((point) => point.y))].sort(
    (a, b) => a - b,
  )
  const edges = polygon
    .map((start, i) => ({ start, end: polygon[(i + 1) % polygon.length]! }))
    .filter(({ start, end }) => start.y !== end.y)
  const xAt = (edge: (typeof edges)[number], y: number) =>
    edge.start.x +
    ((y - edge.start.y) * (edge.end.x - edge.start.x)) /
      (edge.end.y - edge.start.y)
  const rectangles: Bounds[] = []
  let previousBand: Bounds[] = []

  for (let bandIndex = 0; bandIndex + 1 < vertexHeights.length; bandIndex++) {
    const bottom = vertexHeights[bandIndex]!,
      top = vertexHeights[bandIndex + 1]!
    const middle = bottom + (top - bottom) / 2
    const activeEdges = edges
      .filter(
        ({ start, end }) =>
          Math.min(start.y, end.y) <= bottom && Math.max(start.y, end.y) >= top,
      )
      .sort((a, b) => xAt(a, middle) - xAt(b, middle))
    const maxSideDrift = Math.max(
      0,
      ...activeEdges.map((edge) =>
        Math.abs(xAt(edge, top) - xAt(edge, bottom)),
      ),
    )
    const slices = Math.max(
      1,
      Math.ceil((top - bottom) / rectHeight),
      Math.ceil(maxSideDrift / maxSideOverhang),
    )

    for (let slice = 0; slice < slices; slice++) {
      const minY = bottom + ((top - bottom) * slice) / slices
      const maxY =
        slice + 1 === slices
          ? top
          : bottom + ((top - bottom) * (slice + 1)) / slices
      const currentBand: Bounds[] = []
      for (let pair = 0; pair < activeEdges.length; pair += 2) {
        const left = activeEdges[pair]!,
          right = activeEdges[pair + 1]!
        const minX = Math.min(xAt(left, minY), xAt(left, maxY))
        const maxX = Math.max(xAt(right, minY), xAt(right, maxY))
        if (maxX <= minX) continue
        const previous = previousBand.find(
          (rect) =>
            rect.minX === minX && rect.maxX === maxX && rect.maxY === minY,
        )
        if (previous) {
          previous.maxY = maxY
          currentBand.push(previous)
        } else {
          const rect = { minX, maxX, minY, maxY }
          rectangles.push(rect)
          currentBand.push(rect)
        }
      }
      previousBand = currentBand
    }
  }

  return rectangles.map(({ minX, maxX, minY, maxY }) => ({
    center: { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }))
}
