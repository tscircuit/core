import { expect, test } from "bun:test"
import { getPourPolygon } from "@tscircuit/circuit-json-util"
import { Point } from "@flatten-js/core"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ManualThroughViaBoard } from "tests/fixtures/manual-through-via-board"

test("manual vias retain a partial span when blind and buried vias are enabled", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ManualThroughViaBoard allowBlindAndBuriedVias />)
  await circuit.renderUntilSettled()
  const vias = circuit.db.pcb_via.list().filter((v) => v.pcb_trace_id)
  expect(vias).toHaveLength(3)
  const pours = circuit.db.pcb_copper_pour
    .list()
    .filter((p) => p.layer === "bottom")
  expect(vias.map((v) => v.layers)).toEqual([
    ["top", "inner1"],
    ["inner1", "inner2"],
    ["inner2", "inner1", "top"],
  ])
  for (const via of vias) {
    expect(
      pours.some((p) => getPourPolygon(p).contains(new Point(via.x, via.y))),
    ).toBe(true)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
