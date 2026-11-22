import { expect, test } from "bun:test"
import { A13FullDdrBoard } from "tests/fixtures/a13-full-ddr/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("A13 DDR data bytes followed by the remaining signals", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  circuit.add(<A13FullDdrBoard />)
  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(96)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    width: 1400,
    height: 1000,
    shouldDrawErrors: false,
    shouldDrawRatsNest: false,
    showPcbGroups: false,
    showDebugObjects: false,
  })
}, 600_000)
