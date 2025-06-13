import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

export default test("jumper and solderjumper internal pin handling", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <solderjumper name="SJ" bridgedPins={[["1", "2"]]} />
      <jumper name="JP1" internallyConnectedPins={[["1", "2"]]} />
      <jumper name="JP2" internallyConnectedPins={[["pin1", "pin2"]]} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e) => e.type.includes("error"))
  expect(errors.length).toBe(0)
})
