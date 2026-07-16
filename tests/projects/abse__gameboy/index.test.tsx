import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture.ts"
import Project from "./index"

test("abse__gameboy matches pcb snapshot", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Project />)

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 1_000_000)
