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
    <board>
      <voltagesource
        name="VS1"
        peakToPeakVoltage="3V"
        frequency="1kHz"
        waveShape="square"
      />
      <capacitor name="C1" capacitance="10uF" />
      <resistor name="R1" resistance="1k" />
    </board>,
  )

  await circuit.renderUntilSettled()
})
