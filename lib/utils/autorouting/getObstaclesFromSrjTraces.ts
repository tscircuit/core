import type { LayerRef } from "circuit-json"
import { getViaSpanLayers } from "lib/utils/getViaSpanLayers"
import type { Obstacle, SimplifiedPcbTrace } from "./SimpleRouteJson"

type RoutePoint = SimplifiedPcbTrace["route"][number]
type WireRoutePoint = Extract<RoutePoint, { route_type: "wire" }>

const getLayersBetween = (
  fromLayer: string,
  toLayer: string,
  layerCount: number,
): string[] =>
  getViaSpanLayers({
    fromLayer: fromLayer as LayerRef,
    toLayer: toLayer as LayerRef,
    layerCount,
  })

const MAX_APPROXIMATION_RECT_LENGTH = 0.75

const getSegmentObstacles = ({
  obstacleId,
  start,
  end,
  width,
  layer,
  connectedTo,
}: {
  obstacleId: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  width: number
  layer: string
  connectedTo: string[]
}): Obstacle[] => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length <= 0.001) return []

  const obstacleWidth = Math.max(width, 0.001)
  const isHorizontal = Math.abs(dy) <= 1e-9
  const isVertical = Math.abs(dx) <= 1e-9
  if (isHorizontal || isVertical) {
    return [
      {
        obstacleId,
        type: "rect",
        layers: [layer],
        center: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        width: isHorizontal ? length : obstacleWidth,
        height: isVertical ? length : obstacleWidth,
        connectedTo,
      },
    ]
  }

  // Some autorouting pipelines only consume axis-aligned obstacles. Slice a
  // diagonal trace into conservative axis-aligned bounds so its copper remains
  // a keepout regardless of which pipeline handles the parent subcircuit.
  const rectCount = Math.max(
    1,
    Math.ceil(length / MAX_APPROXIMATION_RECT_LENGTH),
  )
  const stepDx = dx / rectCount
  const stepDy = dy / rectCount
  const perpendicularWidthX = Math.abs((obstacleWidth * dy) / length)
  const perpendicularWidthY = Math.abs((obstacleWidth * dx) / length)

  return Array.from({ length: rectCount }, (_, index) => ({
    obstacleId: `${obstacleId}_approx_${index}`,
    type: "rect" as const,
    layers: [layer],
    center: {
      x: start.x + stepDx * (index + 0.5),
      y: start.y + stepDy * (index + 0.5),
    },
    width: Math.abs(stepDx) + perpendicularWidthX,
    height: Math.abs(stepDy) + perpendicularWidthY,
    connectedTo,
  }))
}

const wireSegmentsAreCollinear = ({
  segmentStart,
  segmentEnd,
  nextPoint,
}: {
  segmentStart: WireRoutePoint
  segmentEnd: WireRoutePoint
  nextPoint: WireRoutePoint
}) => {
  const segmentDx = segmentEnd.x - segmentStart.x
  const segmentDy = segmentEnd.y - segmentStart.y
  const nextDx = nextPoint.x - segmentEnd.x
  const nextDy = nextPoint.y - segmentEnd.y
  const crossProduct = segmentDx * nextDy - segmentDy * nextDx
  const lengthProduct =
    Math.hypot(segmentDx, segmentDy) * Math.hypot(nextDx, nextDy)
  const dotProduct = segmentDx * nextDx + segmentDy * nextDy
  return (
    Math.abs(crossProduct) <= 1e-9 * Math.max(1, lengthProduct) &&
    dotProduct >= 0
  )
}

const getWireObstacles = (
  trace: SimplifiedPcbTrace,
  connectedTo: string[],
): Obstacle[] => {
  const obstacles: Obstacle[] = []
  let segmentStartIndex = 0
  while (segmentStartIndex < trace.route.length - 1) {
    const segmentStart = trace.route[segmentStartIndex]!
    const initialSegmentEnd = trace.route[segmentStartIndex + 1]!
    if (
      segmentStart.route_type !== "wire" ||
      initialSegmentEnd.route_type !== "wire" ||
      segmentStart.layer !== initialSegmentEnd.layer
    ) {
      segmentStartIndex++
      continue
    }

    let segmentEndIndex = segmentStartIndex + 1
    while (segmentEndIndex < trace.route.length - 1) {
      const segmentEnd = trace.route[segmentEndIndex]!
      const nextPoint = trace.route[segmentEndIndex + 1]!
      if (
        segmentEnd.route_type !== "wire" ||
        nextPoint.route_type !== "wire" ||
        segmentEnd.layer !== segmentStart.layer ||
        nextPoint.layer !== segmentStart.layer ||
        segmentEnd.width !== segmentStart.width ||
        !wireSegmentsAreCollinear({
          segmentStart,
          segmentEnd,
          nextPoint,
        })
      ) {
        break
      }
      segmentEndIndex++
    }

    const segmentEnd = trace.route[segmentEndIndex] as WireRoutePoint
    const segmentObstacles = getSegmentObstacles({
      obstacleId: `${trace.pcb_trace_id}_${segmentStartIndex}_wire`,
      start: segmentStart,
      end: segmentEnd,
      width: segmentStart.width,
      layer: segmentStart.layer,
      connectedTo,
    })
    obstacles.push(...segmentObstacles)
    segmentStartIndex = segmentEndIndex
  }
  return obstacles
}

export const getObstaclesFromSrjTraces = ({
  traces,
  layerCount,
  viaDiameter,
}: {
  traces: SimplifiedPcbTrace[]
  layerCount: number
  viaDiameter: number
}): Obstacle[] => {
  const obstacles: Obstacle[] = []
  for (const trace of traces) {
    const connectedTo = trace.connectsTo ?? []
    for (let pointIndex = 0; pointIndex < trace.route.length; pointIndex++) {
      const point = trace.route[pointIndex]!
      if (point.route_type === "via") {
        obstacles.push({
          obstacleId: `${trace.pcb_trace_id}_${pointIndex}_via`,
          type: "rect",
          shape: "circle",
          layers: getLayersBetween(
            point.from_layer,
            point.to_layer,
            layerCount,
          ),
          center: { x: point.x, y: point.y },
          width: point.via_diameter ?? viaDiameter,
          height: point.via_diameter ?? viaDiameter,
          connectedTo,
        })
      } else if (point.route_type === "through_obstacle") {
        const segmentObstacles = getSegmentObstacles({
          obstacleId: `${trace.pcb_trace_id}_${pointIndex}_through`,
          start: point.start,
          end: point.end,
          width: point.width,
          layer: point.from_layer,
          connectedTo,
        })
        for (const obstacle of segmentObstacles) {
          obstacle.layers = getLayersBetween(
            point.from_layer,
            point.to_layer,
            layerCount,
          )
          obstacles.push(obstacle)
        }
      }
    }
    obstacles.push(...getWireObstacles(trace, connectedTo))
  }
  return obstacles
}
