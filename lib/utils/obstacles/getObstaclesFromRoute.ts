import type { Obstacle } from "./types"

interface PointWithLayer {
  x: number
  y: number
  layer: string
}

const isCloseTo = (a: number, b: number) => Math.abs(a - b) < 0.0001

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

    const center = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    }

    if (!isHorz && !isVert) {
      // Diagonal segment: emit a tight rotated rectangle (an axis-aligned
      // bounding box would block a large empty region for a 45° trace).
      const dx = end.x - start.x
      const dy = end.y - start.y
      obstacles.push({
        type: "rect",
        layers: [start.layer],
        center,
        width: Math.hypot(dx, dy),
        height: 0.1, // TODO use route width
        ccwRotationDegrees: (Math.atan2(dy, dx) * 180) / Math.PI,
        connectedTo: [source_trace_id],
      })
    } else {
      obstacles.push({
        type: "rect",
        layers: [start.layer],
        center,
        width: isHorz ? Math.abs(start.x - end.x) : 0.1, // TODO use route width
        height: isVert ? Math.abs(start.y - end.y) : 0.1, // TODO use route width
        connectedTo: [source_trace_id],
      })
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
