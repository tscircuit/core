import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

export default test("solderjumper uses internallyConnectedPins only", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <solderjumper
        name="SJ2"
        internallyConnectedPins={[
          ["pin1", "pin9"],
          ["pin9", "pin8"],
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e) => e.type.includes("error"))
  expect(errors.length).toBe(0)
})
