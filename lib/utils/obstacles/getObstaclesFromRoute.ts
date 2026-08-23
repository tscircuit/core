import type { Obstacle } from "./types"

interface PointWithLayer {
  x: number
  y: number
  layer: string
}

const isCloseTo = (a: number, b: number) => Math.abs(a - b) < 0.0001

const TRACE_OBSTACLE_THICKNESS = 0.1
const DIAGONAL_OBSTACLE_MAX_SEGMENT_LENGTH = 0.5

export const getObstaclesFromRoute = (
  route: PointWithLayer[],
  source_trace_id: string,
  { viaDiameter = 0.5 }: { viaDiameter?: number } = {},
): Obstacle[] => {
  const obstacles: Obstacle[] = []
  for (let i = 0; i < route.length - 1; i++) {
    const [start, end] = [route[i], route[i + 1]]
    const prev = i - 1 >= 0 ? route[i - 1] : null

    const isHorz = isCloseTo(start.y, end.y)
    const isVert = isCloseTo(start.x, end.x)

    if (!isHorz && !isVert) {
      const deltaX = end.x - start.x
      const deltaY = end.y - start.y
      const segmentCount = Math.max(
        1,
        Math.ceil(
          Math.hypot(deltaX, deltaY) / DIAGONAL_OBSTACLE_MAX_SEGMENT_LENGTH,
        ),
      )
      for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
        const startRatio = segmentIndex / segmentCount
        const endRatio = (segmentIndex + 1) / segmentCount
        const segmentStartX = start.x + deltaX * startRatio
        const segmentStartY = start.y + deltaY * startRatio
        const segmentEndX = start.x + deltaX * endRatio
        const segmentEndY = start.y + deltaY * endRatio
        obstacles.push({
          type: "rect",
          layers: [start.layer],
          center: {
            x: (segmentStartX + segmentEndX) / 2,
            y: (segmentStartY + segmentEndY) / 2,
          },
          width:
            Math.abs(segmentEndX - segmentStartX) + TRACE_OBSTACLE_THICKNESS,
          height:
            Math.abs(segmentEndY - segmentStartY) + TRACE_OBSTACLE_THICKNESS,
          connectedTo: [source_trace_id],
        })
      }
    } else {
      const obstacle: Obstacle = {
        type: "rect",
        layers: [start.layer],
        center: {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
        },
        width: isHorz ? Math.abs(start.x - end.x) : TRACE_OBSTACLE_THICKNESS, // TODO use route width
        height: isVert ? Math.abs(start.y - end.y) : TRACE_OBSTACLE_THICKNESS, // TODO use route width
        connectedTo: [source_trace_id],
      }

      obstacles.push(obstacle)
    }

    if (prev && prev.layer === start.layer && start.layer !== end.layer) {
      const via: Obstacle = {
        type: "rect",
        layers: [start.layer, end.layer],
        center: {
          x: start.x,
          y: start.y,
        },
        connectedTo: [source_trace_id],
        width: viaDiameter,
        height: viaDiameter,
      }
      obstacles.push(via)
    }
  }
  return obstacles
}
