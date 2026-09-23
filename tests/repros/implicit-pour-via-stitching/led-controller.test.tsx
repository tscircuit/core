import { test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import LedController from "./circuits/led-controller"
import { expectStitchedPourSnapshots } from "./expect-stitched-pour-snapshots"

// Implicit copper pours are disabled; retain coverage for a future re-enable.
test.skip(
  "led-controller stitches vias through implicit power pours",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(<LedController />)
    await circuit.renderUntilSettled()
    await expectStitchedPourSnapshots(circuit, import.meta.path)
  },
  { timeout: 120_000 },
)
