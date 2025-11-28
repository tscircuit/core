/**
 * Computes the intersection point of a line segment with a rectangle.
 * Returns the intersection point closest to the start of the line.
 *
 * @returns The intersection point, or null if no intersection
 */
export function computeLineRectIntersection(params: {
  lineStart: { x: number; y: number }
  lineEnd: { x: number; y: number }
  rectCenter: { x: number; y: number }
  rectWidth: number
  rectHeight: number
}): { x: number; y: number } | null {
  const { lineStart, lineEnd, rectCenter, rectWidth, rectHeight } = params
  // Calculate rectangle edges
  const left = rectCenter.x - rectWidth / 2
  const right = rectCenter.x + rectWidth / 2
  const top = rectCenter.y + rectHeight / 2
  const bottom = rectCenter.y - rectHeight / 2

  // Direction vector from start to end
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  // Find all intersections with the four edges
  const intersections: Array<{ x: number; y: number; t: number }> = []

  // Left edge (x = left)
  if (dx !== 0) {
    const t = (left - lineStart.x) / dx
    if (t >= 0 && t <= 1) {
      const y = lineStart.y + t * dy
      if (y >= bottom && y <= top) {
        intersections.push({ x: left, y, t })
      }
    }
  }

  // Right edge (x = right)
  if (dx !== 0) {
    const t = (right - lineStart.x) / dx
    if (t >= 0 && t <= 1) {
      const y = lineStart.y + t * dy
      if (y >= bottom && y <= top) {
        intersections.push({ x: right, y, t })
      }
    }
  }

  // Bottom edge (y = bottom)
  if (dy !== 0) {
    const t = (bottom - lineStart.y) / dy
    if (t >= 0 && t <= 1) {
      const x = lineStart.x + t * dx
      if (x >= left && x <= right) {
        intersections.push({ x, y: bottom, t })
      }
    }
  }

  // Top edge (y = top)
  if (dy !== 0) {
    const t = (top - lineStart.y) / dy
    if (t >= 0 && t <= 1) {
      const x = lineStart.x + t * dx
      if (x >= left && x <= right) {
        intersections.push({ x, y: top, t })
      }
    }
  }

  // If no intersections, return null
  if (intersections.length === 0) return null

  // Return the intersection closest to the start (smallest t)
  intersections.sort((a, b) => a.t - b.t)
  return { x: intersections[0].x, y: intersections[0].y }
}
