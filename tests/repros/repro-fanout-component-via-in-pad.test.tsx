import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import FanoutComponentViaInPadCircuit from "./repro-fanout-component-via-in-pad-circuit"

test("fanout component passes via-in-pad options to its native router", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<FanoutComponentViaInPadCircuit />)
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
