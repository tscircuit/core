import { pcb_trace } from "circuit-json"

// The primitive owns footprint-local geometry and an optional logical trace
// association. Placement and parent ownership are supplied during rendering.
export const pcbTraceCircuitJsonInput = pcb_trace.pick({
  route: true,
  source_trace_id: true,
})
