import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
  Obstacle,
} from "./SimpleRouteJson"
import { getViaBoardLayers } from "../getViaSpanLayers"

type PcbTraceId = SimplifiedPcbTrace["pcb_trace_id"]

/**
 * Represent manual and saved copper as obstacles so subsequent solvers cannot simplify
 * it. All positions are board-world points in mm (+X right, +Y up, +Z above,
 * right-handed). Rectangles enclose each segment, including its end caps.
 */
export function withFixedTraces(
  input: SimpleRouteJson,
  fixedTraceIds: ReadonlySet<PcbTraceId>,
  options: { useOrientedWireObstacles?: boolean } = {},
): SimpleRouteJson {
  if (fixedTraceIds.size === 0) return input
  const fixedTraces = (input.traces ?? []).filter((trace) =>
    fixedTraceIds.has(trace.pcb_trace_id),
  )
  if (fixedTraces.length === 0) return input
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
      if (
        options.useOrientedWireObstacles &&
        point.x !== next.x &&
        point.y !== next.y
      ) {
        const dx = next.x - point.x
        const dy = next.y - point.y
        obstacles.push({
          obstacleId: `trace_obstacle_fixed_${trace.pcb_trace_id}_${index}`,
          type: "rect",
          center: { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 },
          width: Math.hypot(dx, dy) + width,
          height: width,
          ccwRotationDegrees: (Math.atan2(dy, dx) * 180) / Math.PI,
          layers: [layer],
          connectedTo,
        })
        continue
      }
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
    obstacles: [...input.obstacles, ...obstacles],
  }
}
