import { validateDifferentialPairSourceBuses } from "lib/utils/autorouting/validateDifferentialPairSourceBuses"
import { expect, test } from "bun:test"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import { DifferentialPair_doInitialSourceDesignRuleChecks } from "lib/components/primitive-components/DifferentialPair_doInitialSourceDesignRuleChecks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("throws when a differential-pair terminal has no source component ID", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        maxLengthSkew={0.1}
        name="USB_DATA"
        positiveConnection="DP_SINGLE"
        negativeConnection="DM"
      />
      <chip name="J1" footprint="soic8" pcbX={-6} />
      <chip name="U1" footprint="soic8" pcbX={6} />
      <trace name="DP_SINGLE" from=".J1 > .pin1" to=".U1 > .pin1" />
      <trace name="DM" from=".J1 > .pin2" to=".U1 > .pin2" />
    </board>,
  )

  circuit.render()

  const j1 = circuit.db.source_component.getWhere({ name: "J1" })!
  const j1Pin1 = circuit.db.source_port
    .list()
    .find(
      (sourcePort) =>
        sourcePort.source_component_id === j1.source_component_id &&
        sourcePort.name === "pin1",
    )!
  circuit.db.source_port.update(j1Pin1.source_port_id, {
    source_component_id: null as never,
  })

  const differentialPair = circuit.selectOne(
    "differentialpair",
  ) as DifferentialPair
  expect(() => validateDifferentialPairSourceBuses(circuit.db)).toThrow(
    "terminal without an owning component",
  )
})
