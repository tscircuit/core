import { test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import CompactBeacon from "./circuits/compact-beacon"
import { expectStitchedPourSnapshots } from "./expect-stitched-pour-snapshots"

test(
  "compact-beacon stitches vias through implicit power pours",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(<CompactBeacon />)
    await circuit.renderUntilSettled()
    await expectStitchedPourSnapshots(circuit, import.meta.path)
  },
  { timeout: 120_000 },
)
