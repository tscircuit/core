import { expect, test } from "bun:test"
import SolarBatteryCharger from "./example41-solar-battery-charger.circuit"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "solar battery charger renders to a pcb svg snapshot",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(<SolarBatteryCharger />)

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 120_000 },
)
