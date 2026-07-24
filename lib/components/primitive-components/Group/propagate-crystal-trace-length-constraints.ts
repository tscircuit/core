import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceTrace } from "circuit-json"
import type { Trace } from "../Trace/Trace"
import { getMaxLengthFromConnectedCrystals } from "../Trace/trace-utils/get-max-length-from-connected-components"

type SubcircuitConnectivityMapKey = NonNullable<
  SourceTrace["subcircuit_connectivity_map_key"]
>

export const propagateCrystalTraceLengthConstraints = ({
  db,
  traces,
}: {
  db: CircuitJsonUtilObjects
  traces: Trace[]
}) => {
  const crystalMaxLengthsBySubcircuitConnectivityMapKey = new Map<
    SubcircuitConnectivityMapKey,
    number
  >()

  for (const trace of traces) {
    if (!trace.source_trace_id) continue

    const sourceTrace = db.source_trace.get(trace.source_trace_id)
    const subcircuitConnectivityMapKey =
      sourceTrace?.subcircuit_connectivity_map_key
    if (!subcircuitConnectivityMapKey) continue

    const connectedPorts = trace._findConnectedPorts().ports
    if (!connectedPorts) continue

    const crystalMaxLength = getMaxLengthFromConnectedCrystals(connectedPorts, {
      db,
    })
    if (crystalMaxLength === undefined) continue

    const existingCrystalMaxLength =
      crystalMaxLengthsBySubcircuitConnectivityMapKey.get(
        subcircuitConnectivityMapKey,
      )
    crystalMaxLengthsBySubcircuitConnectivityMapKey.set(
      subcircuitConnectivityMapKey,
      existingCrystalMaxLength === undefined
        ? crystalMaxLength
        : Math.min(existingCrystalMaxLength, crystalMaxLength),
    )
  }

  for (const trace of traces) {
    if (!trace.source_trace_id) continue

    const sourceTrace = db.source_trace.get(trace.source_trace_id)
    const subcircuitConnectivityMapKey =
      sourceTrace?.subcircuit_connectivity_map_key
    if (!sourceTrace || !subcircuitConnectivityMapKey) continue

    const crystalMaxLength =
      crystalMaxLengthsBySubcircuitConnectivityMapKey.get(
        subcircuitConnectivityMapKey,
      )
    if (
      crystalMaxLength === undefined ||
      (sourceTrace.max_length != null &&
        sourceTrace.max_length <= crystalMaxLength)
    ) {
      continue
    }

    db.source_trace.update(sourceTrace.source_trace_id, {
      max_length: crystalMaxLength,
    })
  }
}
