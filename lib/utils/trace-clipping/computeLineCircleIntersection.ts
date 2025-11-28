/**
 * Computes the intersection point of a line segment with a circle.
 * Returns the intersection point closest to the start of the line.
 *
 * @returns The intersection point, or null if no intersection
 */
export function computeLineCircleIntersection(params: {
  lineStart: { x: number; y: number }
  lineEnd: { x: number; y: number }
  circleCenter: { x: number; y: number }
  circleRadius: number
}): { x: number; y: number } | null {
  const { lineStart, lineEnd, circleCenter, circleRadius } = params
  // Translate to origin at circle center
  const x1 = lineStart.x - circleCenter.x
  const y1 = lineStart.y - circleCenter.y
  const x2 = lineEnd.x - circleCenter.x
  const y2 = lineEnd.y - circleCenter.y

  // Direction vector
  const dx = x2 - x1
  const dy = y2 - y1

  // Quadratic formula coefficients for line-circle intersection
  // Line: (x, y) = (x1, y1) + t * (dx, dy) where 0 <= t <= 1
  // Circle: x^2 + y^2 = r^2
  const a = dx * dx + dy * dy
  const b = 2 * (x1 * dx + y1 * dy)
  const c = x1 * x1 + y1 * y1 - circleRadius * circleRadius

  const discriminant = b * b - 4 * a * c

  // No intersection
  if (discriminant < 0) return null

  // Calculate t values
  const sqrtDisc = Math.sqrt(discriminant)
  const t1 = (-b - sqrtDisc) / (2 * a)
  const t2 = (-b + sqrtDisc) / (2 * a)

  // Find the valid t closest to 0 (closest to start)
  let t: number | null = null
  if (t1 >= 0 && t1 <= 1) {
    t = t1
  } else if (t2 >= 0 && t2 <= 1) {
    t = t2
  }

  if (t === null) return null

  // Calculate intersection point (translate back)
  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  }
}
