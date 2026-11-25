import { expect, test } from "bun:test"
import { Bus } from "lib/components/primitive-components/Bus"
import { inflateSourceBus } from "lib/components/primitive-components/Group/Subcircuit/inflators/inflateSourceBus"
import { createBusInflation } from "./create-bus-inflation.fixture"

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
