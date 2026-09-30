import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import type { Breakout } from "./Breakout"

// Match the local dogbones to phase connections after handoffs split the SRJ.
export function getDogboneFanoutTraces(
  breakout: Breakout,
  input: SimpleRouteJson,
) {
  if (!breakout.dogboneTraces)
    throw new Error("Dogbone fanout has not been solved")
  const traces = breakout.dogboneTraces.map((trace) => {
    const connection = input.connections.find((connection) =>
      connection.pointsToConnect.some(
        (point) =>
          point.pcb_port_id && trace.connectsTo?.includes(point.pcb_port_id),
      ),
    )
    if (!connection)
      throw new Error("Dogbone fanout lost its source connection")
    return {
      ...trace,
      connection_name: connection.name,
      source_trace_id: connection.source_trace_id,
      connectsTo: [
        ...new Set([
          ...(trace.connectsTo ?? []),
          ...connection.pointsToConnect.flatMap((point) =>
            point.pointId ? [point.pointId] : [],
          ),
        ]),
      ],
    }
  })
  return traces
}
