import { expect, test } from "bun:test"
import IcePi from "tests/fixtures/icepi/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "IcePi full circuit resolves its typed port selectors",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(<IcePi />)
    await circuit.renderUntilSettled()
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      showDebugObjects: false,
    })
  },
  { timeout: 120_000 },
)
