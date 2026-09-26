import type { PcbTrace } from "circuit-json"
import { getObstaclesFromCircuitJson } from "../obstacles/getObstaclesFromCircuitJson"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

/**
 * Select exact footprint copper for Pipeline9, including after a legacy phase
 * has replaced it with obstacles. Other solvers retain their original obstacles.
 * Both representations use board-world points in mm (+X right, +Y up;
 * right-handed); no coordinate transformation is performed.
 */
export function withFootprintTraceRepresentation({
  input,
  footprintTraces,
  baseTraces,
  useExactTraces,
}: {
  input: SimpleRouteJson
  footprintTraces: PcbTrace[]
  baseTraces: SimplifiedPcbTrace[]
  useExactTraces: boolean
}): SimpleRouteJson {
  const footprintTraceIds = new Set(
    footprintTraces.map((trace) => trace.pcb_trace_id),
  )
  const scopedFootprintTraces = baseTraces.filter((trace) =>
    footprintTraceIds.has(trace.pcb_trace_id),
  )
  if (scopedFootprintTraces.length === 0) return input
  const scopedTraceIds = new Set(
    scopedFootprintTraces.map((trace) => trace.pcb_trace_id),
  )
  return {
    ...input,
    traces: [
      ...(input.traces ?? []).filter(
        (trace) => !scopedTraceIds.has(trace.pcb_trace_id),
      ),
      ...(useExactTraces ? structuredClone(scopedFootprintTraces) : []),
    ],
    obstacles: [
      ...input.obstacles.filter(
        (obstacle) => !scopedTraceIds.has(obstacle.connectedTo[0]!),
      ),
      ...(useExactTraces
        ? []
        : getObstaclesFromCircuitJson(
            footprintTraces.filter((trace) =>
              scopedTraceIds.has(trace.pcb_trace_id),
            ),
          )),
    ],
  }
}
