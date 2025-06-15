import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

// Reproduction for internal connection symbol bug

test("Jumper internallyConnectedPins chooses missing schematic symbol", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" schAutoLayoutEnabled>
      <solderjumper name="SJ" bridgedPins={[["1", "2"]]} schX={0} schY={0} />
      <jumper
        name="JP1"
        internallyConnectedPins={[["1", "2"]]}
        pinCount={2}
        schX={3}
        schY={0}
      />
      <jumper
        name="JP2"
        internallyConnectedPins={[["pin1", "pin2"]]}
        pinCount={2}
        schX={6}
        schY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type.includes("error"))
  expect(errors.length).toBe(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
