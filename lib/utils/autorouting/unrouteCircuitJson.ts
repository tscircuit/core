import type { AnyCircuitElement, CircuitJson } from "circuit-json"

const unroutedElementTypes = new Set<AnyCircuitElement["type"]>([
  "pcb_trace",
  "pcb_trace_error",
  "pcb_bus_routing_constraint_error",
  "pcb_bus_routing_constraint_warning",
])

export const unrouteCircuitJson = (circuitJson: CircuitJson): CircuitJson => {
  return circuitJson.filter(
    (element) => !unroutedElementTypes.has(element.type),
  ) as CircuitJson
}
