import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

/**
 * Retains only terminals physically joined by each native bus route. Geometry
 * uses right-handed board-world points in mm: +X right, +Y top, +Z above.
 */
export function getBusLanesTracesWithPhysicalConnections({
  input,
  traces,
}: {
  input: SimpleRouteJson
  traces: SimplifiedPcbTrace[]
}): SimplifiedPcbTrace[] {
  return traces.map((trace) => {
    const existingTrace = input.traces?.find(
      (candidate) => candidate.pcb_trace_id === trace.pcb_trace_id,
    )
    if (existingTrace) {
      if (JSON.stringify(trace.route) !== JSON.stringify(existingTrace.route)) {
        throw new Error(
          `Bus routing changed pre-existing trace "${trace.pcb_trace_id}"`,
        )
      }
      return existingTrace
    }

    const connection = input.connections.find(
      (candidate) => candidate.name === trace.connection_name,
    )
    if (!connection) {
      throw new Error(
        `Bus route "${trace.pcb_trace_id}" is missing source connection "${trace.connection_name}"`,
      )
    }

    const physicalConnectionIds = new Set(trace.connectsTo ?? [])
    for (const terminal of connection.pointsToConnect) {
      const touchesTerminal = trace.route.some(
        (point) =>
          point.route_type === "wire" &&
          point.layer === terminal.layer &&
          Math.hypot(point.x - terminal.x, point.y - terminal.y) <= 1e-6,
      )
      if (!touchesTerminal) continue
      if (terminal.pcb_port_id) physicalConnectionIds.add(terminal.pcb_port_id)
      if (terminal.pointId) physicalConnectionIds.add(terminal.pointId)
    }
    return { ...trace, connectsTo: [...physicalConnectionIds] }
  })
}
