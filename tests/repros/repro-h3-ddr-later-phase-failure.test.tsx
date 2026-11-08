import { expect, test } from "bun:test"
import { H3DdrBoard } from "tests/fixtures/h3-ddr/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("H3 DDR data bytes followed by a failed remaining phase", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<H3DdrBoard />)
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    width: 1400,
    height: 1000,
    shouldDrawErrors: false,
    shouldDrawRatsNest: false,
    showPcbGroups: false,
    showDebugObjects: false,
  })
}, 60_000)
