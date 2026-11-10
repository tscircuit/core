import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
  Obstacle,
} from "./SimpleRouteJson"
import type { LayerRef } from "circuit-json"
import { getAutoroutedViaLayers } from "../getViaSpanLayers"

type PcbTraceId = SimplifiedPcbTrace["pcb_trace_id"]

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
  const obstacles: Obstacle[] = []
  for (const trace of fixedTraces) {
    const connectedTo = [
      trace.connection_name ?? trace.pcb_trace_id,
      ...(trace.connectsTo ?? []),
    ]
    for (const [index, point] of trace.route.entries()) {
      if (point.route_type === "via") {
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
          layers: getAutoroutedViaLayers({
            fromLayer: point.from_layer as LayerRef,
            toLayer: point.to_layer as LayerRef,
            layerCount: input.layerCount,
            allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
            physicalLayers: point.layers as LayerRef[] | undefined,
          }),
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
      const rawWidth =
        point.route_type === "wire"
          ? point.width
          : next.route_type === "wire"
            ? next.width
            : input.minTraceWidth
      const width =
        typeof rawWidth === "number" && rawWidth > 0
          ? rawWidth
          : typeof input.minTraceWidth === "number" && input.minTraceWidth > 0
            ? input.minTraceWidth
            : 0.15
      const layer = point.route_type === "wire" ? point.layer : point.to_layer
      const dx = next.x - point.x
      const dy = next.y - point.y
      if (dx === 0 && dy === 0) {
        const via = [point, next].find(
          (endpoint) => endpoint.route_type === "via",
        )
        if (via) {
          const viaDiameter =
            via.via_diameter ??
            input.minViaPadDiameter ??
            input.minViaDiameter ??
            0.6
          if (width <= viaDiameter) continue
        }
      }
      if (dx === 0 || dy === 0) {
        obstacles.push({
          type: "rect",
          center: { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 },
          width: Math.abs(dx) + width,
          height: Math.abs(dy) + width,
          layers: [layer],
          connectedTo,
        })
        continue
      }

      const segmentLength = Math.hypot(dx, dy)
      const steps = Math.max(1, Math.ceil(segmentLength / width))
      // Project the perpendicular stroke width onto each board axis.
      const projectedWidthX = (Math.abs(dy) / segmentLength) * width
      const projectedWidthY = (Math.abs(dx) / segmentLength) * width
      for (let step = 0; step < steps; step++) {
        obstacles.push({
          type: "rect",
          center: {
            x: point.x + (dx * (step + 0.5)) / steps,
            y: point.y + (dy * (step + 0.5)) / steps,
          },
          width: Math.abs(dx) / steps + projectedWidthX,
          height: Math.abs(dy) / steps + projectedWidthY,
          layers: [layer],
          connectedTo,
        })
      }
      // The union of these rectangles conservatively covers a round end cap.
      for (const endpoint of [point, next]) {
        obstacles.push(
          {
            type: "rect",
            center: { x: endpoint.x, y: endpoint.y },
            width,
            height: width * Math.SQRT1_2,
            layers: [layer],
            connectedTo,
          },
          {
            type: "rect",
            center: { x: endpoint.x, y: endpoint.y },
            width: width * Math.SQRT1_2,
            height: width,
            layers: [layer],
            connectedTo,
          },
        )
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
