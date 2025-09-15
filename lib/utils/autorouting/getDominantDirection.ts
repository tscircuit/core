import type { Point } from "@tscircuit/math-utils"

export function getDominantDirection(edge: {
  from: Point
  to: Point
}): "right" | "left" | "up" | "down" {
  const delta = {
    x: edge.to.x - edge.from.x,
    y: edge.to.y - edge.from.y,
  }

  // Use absolute values to compare magnitude of x and y movement
  const absX = Math.abs(delta.x)
  const absY = Math.abs(delta.y)

  // If horizontal movement is greater than vertical
  if (absX > absY) {
    return delta.x > 0 ? "right" : "left"
  }

  // If vertical movement is greater than or equal to horizontal
  return delta.y > 0 ? "down" : "up"
}
