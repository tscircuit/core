// Return "up", "down", "left", or "right" based on the angle between two points
// A & B. The direction is relative to A. So if B is to the right of A, the
// direction is "right". The largest distance wins
export function getRelativeDirection(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
): "up" | "down" | "left" | "right" {
  const dx = pointB.x - pointA.x
  const dy = pointB.y - pointA.y

  // Handle zero distance case
  if (dx === 0 && dy === 0) {
    return "right"
  }

  // If distances are equal or dx is greater/equal, prefer horizontal
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left"
  }
  return dy >= 0 ? "up" : "down"
}
