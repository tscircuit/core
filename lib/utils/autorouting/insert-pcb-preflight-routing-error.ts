import type { PcbPreflightRoutingErrorInput } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export function insertPcbPreflightRoutingError(
  component: PrimitiveComponent,
  error: Omit<PcbPreflightRoutingErrorInput, "type">,
) {
  const { db } = component.root!
  if (
    db.pcb_preflight_routing_error
      .list()
      .some(
        (existing) =>
          existing.subcircuit_id === error.subcircuit_id &&
          existing.routing_phase_index === error.routing_phase_index &&
          existing.phase_name === error.phase_name &&
          existing.error_code === error.error_code &&
          existing.message === error.message,
      )
  )
    return
  db.pcb_preflight_routing_error.insert({
    ...error,
    error_type: "pcb_preflight_routing_error",
  })
}
