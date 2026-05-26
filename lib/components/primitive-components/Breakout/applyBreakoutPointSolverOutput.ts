import type { BreakoutPointSolverOutput } from "@tscircuit/breakout-point-solver"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Breakout } from "./Breakout"

const getSourceNetIdForBreakoutPoint = ({
  db,
  sourceTraceId,
  sourcePortId,
}: {
  db: CircuitJsonUtilObjects
  sourceTraceId: string
  sourcePortId: string
}) => {
  const trace = db.source_trace.get(sourceTraceId)
  if (trace?.connected_source_net_ids?.[0]) {
    return trace.connected_source_net_ids[0]
  }

  const portTrace = db.source_trace
    .list()
    .find((sourceTrace) =>
      sourceTrace.connected_source_port_ids.includes(sourcePortId),
    )
  return portTrace?.connected_source_net_ids?.[0]
}

export const applyBreakoutPointSolverOutput = ({
  breakout,
  output,
}: {
  breakout: Breakout
  output: BreakoutPointSolverOutput
}) => {
  if (!breakout.root || !breakout.pcb_group_id) return

  const { db } = breakout.root
  const subcircuitId =
    breakout.subcircuit_id ?? breakout.getSubcircuit()?.subcircuit_id

  for (const point of output.breakoutPoints) {
    db.pcb_breakout_point.insert({
      pcb_group_id: breakout.pcb_group_id,
      subcircuit_id: subcircuitId ?? undefined,
      source_port_id: point.sourcePortId,
      source_trace_id: point.sourceTraceId,
      source_net_id: getSourceNetIdForBreakoutPoint({
        db,
        sourceTraceId: point.sourceTraceId,
        sourcePortId: point.sourcePortId,
      }),
      x: point.x,
      y: point.y,
    })
  }
}
