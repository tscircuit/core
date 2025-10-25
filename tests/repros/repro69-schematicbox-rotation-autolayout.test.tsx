import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("repro69: schematicbox rotation with autolayout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="40mm" routingDisabled schAutoLayoutEnabled>
      <capacitor
        name="C1"
        capacitance="10uF"
        maxVoltageRating="16V"
        footprint="0805"
      />
      <capacitor
        name="C3"
        capacitance="10uF"
        maxVoltageRating="16V"
        footprint="0805"
      />

      <chip
        name="FB1"
        pinLabels={{
          pin1: ["pin1"],
          pin2: ["pin2"],
        }}
      />
      <trace from="FB1.pin2" to="C1.pin1" />
      <trace from="C1.pin1" to="C3.pin1" />
      <trace from="C1.pin2" to="net.GND" />
      <trace from="C3.pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
