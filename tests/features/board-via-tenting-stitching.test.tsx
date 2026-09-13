import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board tenting overrides stitching solver defaults and preserves omitted behavior", async () => {
  for (const [defaultViaTenting, top, bottom] of [
    [undefined, true, true],
    [true, true, true],
    [false, false, false],
    ["top_tented", true, false],
    ["bottom_tented", false, true],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit._featurePcbViaStitching = true
    circuit.add(
      <board width={6} height={6} defaultViaTenting={defaultViaTenting}>
        <net name="GND" />
        <copperpour connectsTo="net.GND" layer="top" />
        <copperpour connectsTo="net.GND" layer="bottom" />
      </board>,
    )
    await circuit.renderUntilSettled()
    const vias = circuit.db.pcb_via.list()
    expect(vias.length).toBeGreaterThan(0)
    for (const via of vias) {
      expect([via.tented_on_top, via.tented_on_bottom]).toEqual([top, bottom])
      expect(via).not.toHaveProperty("is_tented")
      expect(via.hole_diameter).toBeGreaterThan(0)
    }
  }
})
