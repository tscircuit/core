import type { AnyCircuitElement } from "circuit-json"
import type { Obstacle } from "lib/utils/obstacles/types"
import {
  applyToPoint,
  compose,
  inverse,
  rotateDEG,
  translate,
} from "transformation-matrix"

/** Board-world points, mm, +X right/+Y up, right-handed; rotation is CCW. */
export function obstacleContainsPoint(
  obstacle: Obstacle,
  point: { x: number; y: number },
) {
  const local = applyToPoint(
    inverse(
      compose(
        translate(obstacle.center.x, obstacle.center.y),
        rotateDEG(obstacle.ccwRotationDegrees ?? 0),
      ),
    ),
    point,
  )
  return obstacle.shape === "circle"
    ? Math.hypot(local.x, local.y) <= obstacle.width / 2 + 1e-9
    : Math.abs(local.x) <= obstacle.width / 2 + 1e-9 &&
        Math.abs(local.y) <= obstacle.height / 2 + 1e-9
}

/** Render the actual SRJ obstacles below their source pads, in board-world mm. */
export function padObstaclePreview(obstacles: Obstacle[]): AnyCircuitElement[] {
  return obstacles.map((obstacle, index) => {
    const pad = {
      type: "pcb_smtpad" as const,
      pcb_smtpad_id: `srj_preview_${index}`,
      pcb_component_id: "srj_preview",
      x: obstacle.center.x,
      y: obstacle.center.y - 6,
      layer: "top" as const,
    }
    return obstacle.shape === "circle"
      ? { ...pad, shape: "circle", radius: obstacle.width / 2 }
      : {
          ...pad,
          shape: "rotated_rect",
          width: obstacle.width,
          height: obstacle.height,
          ccw_rotation: obstacle.ccwRotationDegrees ?? 0,
        }
  })
}
