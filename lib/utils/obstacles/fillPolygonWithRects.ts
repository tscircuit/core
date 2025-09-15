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
 */
export function fillPolygonWithRects(
  polygon: Point[],
  options: {
    rectHeight?: number
  } = {},
): Rect[] {
  if (polygon.length < 3) return []

  const { rectHeight = 0.1 } = options

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
