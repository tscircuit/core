import { test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import AnalogInput from "./circuits/analog-input"
import { expectStitchedPourSnapshots } from "./expect-stitched-pour-snapshots"

test(
  "analog-input stitches vias through implicit power pours",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(<AnalogInput />)
    await circuit.renderUntilSettled()
    await expectStitchedPourSnapshots(circuit, import.meta.path)
  },
  { timeout: 120_000 },
)
