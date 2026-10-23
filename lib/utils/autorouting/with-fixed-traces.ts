import { getViaBoardLayers } from "../getViaSpanLayers"
import type {
  Obstacle,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "./SimpleRouteJson"

type PcbTraceId = SimplifiedPcbTrace["pcb_trace_id"]

const isPointOnObstacle = (
  point: { x: number; y: number; layer: string },
  obstacle: Obstacle,
): boolean => {
  if (!obstacle.layers.includes(point.layer)) return false
  const dx = point.x - obstacle.center.x
  const dy = point.y - obstacle.center.y
  const radians = ((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
  const localX = dx * Math.cos(radians) + dy * Math.sin(radians)
  const localY = -dx * Math.sin(radians) + dy * Math.cos(radians)
  return (
    Math.abs(localX) <= obstacle.width / 2 + 1e-3 &&
    Math.abs(localY) <= obstacle.height / 2 + 1e-3
  )
}

/**
 * Represent manual and saved copper as obstacles so subsequent solvers cannot simplify
 * it. All positions are board-world points in mm (+X right, +Y up, +Z above,
 * right-handed). Rectangles enclose each segment, including its end caps.
 */
export function withFixedTraces(
  input: SimpleRouteJson,
  fixedTraceIds: ReadonlySet<PcbTraceId>,
): SimpleRouteJson {
  if (fixedTraceIds.size === 0) return input
  const fixedTraces = (input.traces ?? []).filter((trace) =>
    fixedTraceIds.has(trace.pcb_trace_id),
  )
  if (fixedTraces.length === 0) return input
  const connectionPointsByPointId = new Map<
    string,
    Array<{ x: number; y: number; layer: string }>
  >()
  for (const connection of input.connections) {
    for (const point of connection.pointsToConnect) {
      for (const pointId of [point.pointId, point.pcb_port_id]) {
        if (!pointId) continue
        const points = connectionPointsByPointId.get(pointId) ?? []
        points.push(point)
        connectionPointsByPointId.set(pointId, points)
      }
    }
  }
  const obstacles: Obstacle[] = []
  for (const trace of fixedTraces) {
    const connectedTo = [
      trace.connection_name ?? trace.pcb_trace_id,
      ...(trace.connectsTo ?? []),
    ]
    for (const [index, point] of trace.route.entries()) {
      if (point.route_type === "via") {
        const boardLayers = getViaBoardLayers(input.layerCount)
        const from = boardLayers.findIndex(
          (layer) => layer === point.from_layer,
        )
        const to = boardLayers.findIndex((layer) => layer === point.to_layer)
        const diameter =
          point.via_diameter ??
          input.minViaPadDiameter ??
          input.minViaDiameter ??
          0.6
        obstacles.push({
          type: "rect",
          center: { x: point.x, y: point.y },
          width: diameter,
          height: diameter,
          layers: boardLayers.slice(Math.min(from, to), Math.max(from, to) + 1),
          connectedTo,
        })
      }
      const next = trace.route[index + 1]
      if (
        !next ||
        (point.route_type !== "wire" && point.route_type !== "via") ||
        (next.route_type !== "wire" && next.route_type !== "via")
      )
        continue
      const width =
        point.route_type === "wire"
          ? point.width
          : next.route_type === "wire"
            ? next.width
            : input.minTraceWidth
      const layer = point.route_type === "wire" ? point.layer : point.to_layer
      // Small axis-aligned boxes conservatively cover diagonal copper too.
      const steps =
        point.x === next.x || point.y === next.y
          ? 1
          : Math.max(
              1,
              Math.ceil(Math.hypot(next.x - point.x, next.y - point.y) / width),
            )
      for (let step = 0; step < steps; step++) {
        const x1 = point.x + ((next.x - point.x) * step) / steps
        const y1 = point.y + ((next.y - point.y) * step) / steps
        const x2 = point.x + ((next.x - point.x) * (step + 1)) / steps
        const y2 = point.y + ((next.y - point.y) * (step + 1)) / steps
        obstacles.push({
          type: "rect",
          center: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 },
          width: Math.abs(x2 - x1) + width,
          height: Math.abs(y2 - y1) + width,
          layers: [layer],
          connectedTo,
        })
      }
    }
  }
  return {
    ...input,
    traces: input.traces?.filter(
      (trace) => !fixedTraceIds.has(trace.pcb_trace_id),
    ),
    obstacles: [
      ...input.obstacles.map((obstacle) => ({
        ...obstacle,
        connectedTo: obstacle.connectedTo.filter((id) => {
          const points = connectionPointsByPointId.get(id)
          if (!points) return true
          return points.some((point) => isPointOnObstacle(point, obstacle))
        }),
      })),
      ...obstacles,
    ],
  }
}
