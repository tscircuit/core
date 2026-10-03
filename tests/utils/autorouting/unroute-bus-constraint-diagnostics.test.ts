import { expect, test } from "bun:test"
import {
  source_bus,
  pcb_bus_routing_constraint_error,
  pcb_bus_routing_constraint_warning,
} from "circuit-json"
import { unrouteCircuitJson } from "lib/utils/autorouting/unrouteCircuitJson"

test("unrouting clears stale bus constraint findings but retains source intent", () => {
  const bus = source_bus.parse({
    type: "source_bus",
    source_bus_id: "bus",
    source_trace_ids: ["signal"],
    max_length: 10,
  })
  const references = {
    source_bus_id: "bus",
    source_trace_ids: ["signal"],
    pcb_trace_ids: ["pcb_signal"],
    message: "DATA routing constraint",
  }
  const error = pcb_bus_routing_constraint_error.parse({
    ...references,
    type: "pcb_bus_routing_constraint_error",
    routing_rule: "max_length",
    actual_trace_length: 11,
    maximum_trace_length: 10,
  })
  const warning = pcb_bus_routing_constraint_warning.parse({
    ...references,
    type: "pcb_bus_routing_constraint_warning",
    routing_rule: "physical_impedance",
  })
  expect(unrouteCircuitJson([bus, error, warning])).toEqual([bus])
})
