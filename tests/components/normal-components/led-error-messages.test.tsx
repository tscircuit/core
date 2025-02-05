import { test, expect } from "bun:test"
import { getTestFixture } from "../../../tests/fixtures/get-test-fixture"

test("LED without footprint should throw appropriate error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <led name="LED1" />
    </board>,
  )

  try {
    circuit.render()
  } catch (err) {
    if (!(err instanceof Error)) {
      throw new Error("Expected err to be an Error instance")
    }
    expect(err.message).toBe(
      'Led "LED1" does not have a footprint. Add a footprint prop, e.g. <Led footprint="..." />',
    )
  }
})
