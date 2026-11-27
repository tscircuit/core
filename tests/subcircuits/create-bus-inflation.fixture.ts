import { cju } from "@tscircuit/circuit-json-util"
import type { SourceBus } from "circuit-json"
import { Subcircuit } from "lib/components/primitive-components/Group/Subcircuit/Subcircuit"

export function createBusInflation() {
  const injectionDb = cju([])
  const trace = injectionDb.source_trace.insert({
    name: "data",
    connected_source_port_ids: [],
    connected_source_net_ids: [],
  })
  const sourceBus: SourceBus = {
    type: "source_bus",
    source_bus_id: "source_bus_1",
    name: "test",
    source_trace_ids: [trace.source_trace_id],
  }
  const subcircuit = new Subcircuit({ name: "test" })
  return { sourceBus, inflatorContext: { injectionDb, subcircuit } }
}
