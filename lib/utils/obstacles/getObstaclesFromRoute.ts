import type { Obstacle } from "./types"

interface PointWithLayer {
  x: number
  y: number
  layer: string
  width?: number
  viaLayers?: string[]
  viaDiameter?: number
  outgoingLayer?: string
}

const isCloseTo = (a: number, b: number) => Math.abs(a - b) < 0.0001

export const getObstaclesFromRoute = (
  route: PointWithLayer[],
  source_trace_id: string,
  { viaDiameter = 0.5 }: { viaDiameter?: number } = {},
): Obstacle[] => {
  const obstacles: Obstacle[] = []
  for (let i = 0; i < route.length; i++) {
    const start = route[i]
    if (start.viaLayers) {
      obstacles.push({
        type: "rect",
        layers: start.viaLayers,
        center: { x: start.x, y: start.y },
        width: start.viaDiameter ?? viaDiameter,
        height: start.viaDiameter ?? viaDiameter,
        connectedTo: [source_trace_id],
      })
    }
    const end = route[i + 1]
    if (!end) break
    const prev = i - 1 >= 0 ? route[i - 1] : null

    const isHorz = isCloseTo(start.y, end.y)
    const isVert = isCloseTo(start.x, end.x)

    if (
      (start.viaLayers || end.viaLayers) &&
      start.x === end.x &&
      start.y === end.y
    )
      continue

    const dx = end.x - start.x
    const dy = end.y - start.y
    const obstacle: Obstacle = {
      type: "rect",
      layers: [start.outgoingLayer ?? start.layer],
      center: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      width: isHorz ? Math.abs(dx) : 0.1,
      height: isVert ? Math.abs(dy) : 0.1,
      connectedTo: [source_trace_id],
    }
    if (!isHorz && !isVert) {
      // Board-world angle in degrees. Include the copper at both round end caps.
      const thickness = start.width ?? end.width ?? 0.1
      obstacle.width = Math.hypot(dx, dy) + thickness
      obstacle.height = thickness
      obstacle.ccwRotationDegrees = (Math.atan2(dy, dx) * 180) / Math.PI
    }
    obstacles.push(obstacle)

    if (
      !start.viaLayers &&
      prev &&
      prev.layer === start.layer &&
      start.layer !== end.layer
    ) {
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
