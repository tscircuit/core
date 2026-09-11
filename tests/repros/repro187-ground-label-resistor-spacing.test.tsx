import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro187: ground label crowds a vertical resistor", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schAutoLayoutEnabled schTraceAutoLabelEnabled>
      <schematicsheet name="main" sheetSize="A4">
        <resistor name="R1" resistance="100k" schOrientation="vertical" />

        <trace from="R1.pin1" to="net.VREF" />
        <trace from="R1.pin2" to="net.GND" />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
