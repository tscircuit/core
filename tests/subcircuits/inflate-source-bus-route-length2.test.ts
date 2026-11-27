import { expect, test } from "bun:test"
import { inflateSourceBus } from "lib/components/primitive-components/Group/Subcircuit/inflators/inflateSourceBus"
import { createBusInflation } from "./create-bus-inflation.fixture"

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
