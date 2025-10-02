import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("spice-analysis01-platform-config", async () => {
  const { circuit } = getTestFixture()

  circuit.platform = {
    spiceEngine: {
      async simulate(spiceString: string) {
        return {
          simulationResultCircuitJson: [],
        }
      },
    },
  }

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor name="C1" capacitance="10uF" footprint="0805" />
    </board>,
  )

  await circuit.renderUntilSettled()
})
