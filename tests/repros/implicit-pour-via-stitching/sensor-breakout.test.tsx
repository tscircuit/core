import { test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import SensorBreakout from "./circuits/sensor-breakout"
import { expectStitchedPourSnapshots } from "./expect-stitched-pour-snapshots"

test(
  "sensor-breakout stitches vias through implicit power pours",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(<SensorBreakout />)
    await circuit.renderUntilSettled()
    await expectStitchedPourSnapshots(circuit, import.meta.path)
  },
  { timeout: 120_000 },
)
