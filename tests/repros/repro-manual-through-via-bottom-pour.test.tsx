import { expect, test } from "bun:test"
import { getPourPolygon } from "@tscircuit/circuit-json-util"
import { Point } from "@flatten-js/core"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ManualThroughViaBoard } from "tests/fixtures/manual-through-via-board"

test("manual top-to-inner1 vias clear bottom pours on a through-hole board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ManualThroughViaBoard />)
  await circuit.renderUntilSettled()
  const vias = circuit.db.pcb_via.list().filter((v) => v.pcb_trace_id)
  expect(vias).toHaveLength(3)
  const pours = circuit.db.pcb_copper_pour
    .list()
    .filter((p) => p.layer === "bottom")
  expect(pours.length).toBeGreaterThan(0)
  for (const via of vias) {
    expect(via.layers).toEqual(["top", "inner1", "inner2", "bottom"])
    for (const pour of pours)
      expect(getPourPolygon(pour).contains(new Point(via.x, via.y))).toBe(false)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
