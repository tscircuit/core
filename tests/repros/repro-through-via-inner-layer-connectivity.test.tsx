import { expect, test } from "bun:test"
import { ThroughViaInnerLayerBoard } from "tests/fixtures/through-via-inner-layer-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("through-via barrels connect separate top escapes to an inner2 bridge", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ThroughViaInnerLayerBoard />)
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_via.list()).toHaveLength(2)
  for (const via of circuit.db.pcb_via.list())
    expect(via.layers).toEqual(["top", "inner1", "inner2", "bottom"])
  expect(
    circuit.db.pcb_trace
      .list()
      .some((t) =>
        t.route.some((p) => p.route_type === "wire" && p.layer === "inner2"),
      ),
  ).toBe(true)
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
