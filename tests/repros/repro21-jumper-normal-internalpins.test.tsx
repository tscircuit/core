import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

export default test("jumper internally connected pins without pinCount", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper name="JP1" internallyConnectedPins={[["1", "2"]]} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e) => e.type.includes("error"))
  expect(errors.length).toBe(0)
})
