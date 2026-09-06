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
  const groundPad = circuit.db.pcb_smtpad
    .list()
    .find((smtpad) => smtpad.shape === "circle")!
  const groundVia = circuit.db.pcb_via.list()[0]!
  expect(groundVia.x).toBeCloseTo(groundPad.x, 6)
  expect(groundVia.y).toBeCloseTo(groundPad.y, 6)
  expect(groundVia.to_layer).toBe("inner1")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
