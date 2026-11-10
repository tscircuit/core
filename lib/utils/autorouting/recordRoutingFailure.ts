import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { RoutingFailure } from "@tscircuit/capacity-autorouter"
import type { SourceBus } from "circuit-json"

/** Format dependency failures with readable names; keep identifiers in payloads. */
export function recordRoutingFailure({
  db,
  failure,
  sourceBusIds,
  subcircuitId,
}: {
  db: CircuitJsonUtilObjects
  failure: RoutingFailure
  sourceBusIds: SourceBus["source_bus_id"][]
  subcircuitId?: string | null
}) {
  let message: string
  let differential_pair_length_skew
  if (failure.reason === "routing_failed") {
    message = failure.message
  } else {
    const pair = db.source_bus.get(sourceBusIds[failure.pairIndex]!)
    if (!pair?.differential_pair)
      throw new Error("Router returned an invalid differential pair index")
    const label = `Differential pair "${pair.name || "unnamed pair"}"`
    if (failure.reason === "length_skew") {
      const [positive_length, negative_length] = failure.laneLengthsMm
      const skew = Math.abs(positive_length - negative_length)
      if (
        ![positive_length, negative_length].every(
          (length) => Number.isFinite(length) && length >= 0,
        ) ||
        skew <= pair.max_length_skew + 1e-9
      )
        throw new Error(`${label}: router returned invalid lane measurements`)
      message = `${label}: ${positive_length > negative_length ? "positive" : "negative"} lane is ${skew.toFixed(3)}mm longer (positive ${positive_length.toFixed(3)}mm, negative ${negative_length.toFixed(3)}mm); maximum allowed skew is ${pair.max_length_skew}mm`
      differential_pair_length_skew = {
        source_bus_id: pair.source_bus_id,
        positive_length,
        negative_length,
      }
    } else {
      const trace = failure.connectionName
        ? db.source_trace.get(failure.connectionName)
        : null
      const hop = trace ? ` on trace "${trace.name || "unnamed trace"}"` : ""
      const reasons = {
        missing_hop_route: "a hop has no routed copper",
        ownership_violation: "a hop lost its declared endpoints or ownership",
        invalid_differential_pair: "invalid differential pair routing request",
        unsupported_routing_scope:
          "phased, preserved or breakout routing is unsupported",
      }
      message = `${label}: ${reasons[failure.reason]}${hop}`
    }
  }
  db.pcb_autorouting_error.insert({
    pcb_error_id: `pcb_autorouter_error_subcircuit_${subcircuitId}`,
    error_type: "pcb_autorouting_error",
    subcircuit_id: subcircuitId ?? undefined,
    message,
    differential_pair_length_skew,
  })
  return message
}
