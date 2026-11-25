import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { SourceBus } from "circuit-json"
import { Bus } from "lib/components/primitive-components/Bus"
import { Subcircuit } from "lib/components/primitive-components/Group/Subcircuit/Subcircuit"
import { inflateSourceBus } from "lib/components/primitive-components/Group/Subcircuit/inflators/inflateSourceBus"

function createBusInflation() {
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

test("bus inflation preserves zero and skips absent route lengths", () => {
  const { sourceBus, inflatorContext } = createBusInflation()
  inflateSourceBus({
    sourceBus: { ...sourceBus, min_length: 0 },
    inflatorContext,
  })

  const [bus] = inflatorContext.subcircuit.children
  expect(bus).toBeInstanceOf(Bus)
  if (!(bus instanceof Bus)) throw new Error("Expected an inflated bus")
  expect(bus.props.minLength).toBe(0)
  expect(bus.props.maxLength).toBeUndefined()
  expect(bus.props.targetLength).toBeUndefined()
})

test("bus inflation does not silently drop an unresolvable length reference", () => {
  const { sourceBus, inflatorContext } = createBusInflation()
  expect(() =>
    inflateSourceBus({
      sourceBus: {
        ...sourceBus,
        target_length: {
          reference: "longest_manhattan",
          source_trace_ids: ["source_trace_missing"],
        },
      },
      inflatorContext,
    }),
  ).toThrow("Cannot restore bus route-length constraint")
  expect(inflatorContext.subcircuit.children).toHaveLength(0)
})
