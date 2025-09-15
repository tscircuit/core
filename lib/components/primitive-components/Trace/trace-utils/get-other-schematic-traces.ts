import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicTrace } from "circuit-json"

export const getOtherSchematicTraces = ({
  db,
  source_trace_id,
  sameNetOnly,
  differentNetOnly,
}: {
  db: CircuitJsonUtilObjects
  source_trace_id: string
  sameNetOnly?: boolean
  differentNetOnly?: boolean
}): SchematicTrace[] => {
  if (!sameNetOnly && !differentNetOnly) {
    differentNetOnly = true
  }
  const mySourceTrace = db.source_trace.get(source_trace_id)!
  const traces: SchematicTrace[] = []
  for (const otherSchematicTrace of db.schematic_trace.list()) {
    if (otherSchematicTrace.source_trace_id === source_trace_id) continue
    // Check if these traces are connected to the same connectivity map key
    const otherSourceTrace = db.source_trace.get(
      otherSchematicTrace.source_trace_id!,
    )

    const isSameNet =
      otherSourceTrace?.subcircuit_connectivity_map_key ===
      mySourceTrace.subcircuit_connectivity_map_key

    if (differentNetOnly && isSameNet) {
      continue
    }

    if (sameNetOnly && !isSameNet) {
      continue
    }

    traces.push(otherSchematicTrace)
  }

  return traces
}
