import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type { Obstacle } from "./types"

/**
 * Express rounded copper as an exact union of existing SRJ rectangles/circles.
 * The center is a board-world point in mm (+X right, +Y up, right-handed).
 * Width/height are local lengths; rotation is CCW about the center.
 */
export function getRoundedRectObstacles(
  obstacle: Obstacle,
  cornerRadius: number,
): Obstacle[] {
  const radius = Math.min(cornerRadius, obstacle.width / 2, obstacle.height / 2)
  if (radius <= 0) return [obstacle]

  const obstacles: Obstacle[] = []
  if (obstacle.width > 2 * radius) {
    obstacles.push({ ...obstacle, width: obstacle.width - 2 * radius })
  }
  if (obstacle.height > 2 * radius) {
    obstacles.push({ ...obstacle, height: obstacle.height - 2 * radius })
  }

  const padToBoardTransform = compose(
    translate(obstacle.center.x, obstacle.center.y),
    rotateDEG(obstacle.ccwRotationDegrees ?? 0),
  )
  const xOffsets = [
    ...new Set([radius - obstacle.width / 2, obstacle.width / 2 - radius]),
  ]
  const yOffsets = [
    ...new Set([radius - obstacle.height / 2, obstacle.height / 2 - radius]),
  ]
  for (const x of xOffsets) {
    for (const y of yOffsets) {
      obstacles.push({
        ...obstacle,
        shape: "circle",
        center: applyToPoint(padToBoardTransform, { x, y }),
        width: 2 * radius,
        height: 2 * radius,
        ccwRotationDegrees: undefined,
      })
    }
  }
  return obstacles
}
