import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ManualViaPhysicalSpanPcbPathsBoard } from "tests/fixtures/manual-via-physical-span-pcb-paths-board"

test.failing(
  "pcbPaths uses through-hole spans when blind vias are disabled",
  async () => {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true
    circuit.add(<ManualViaPhysicalSpanPcbPathsBoard />)
    await circuit.renderUntilSettled()

    const vias = circuit.db.pcb_via.list()
    expect(vias).toHaveLength(7)
    expect(vias.map((via) => [via.from_layer, via.to_layer])).toEqual([
      ["top", "inner2"],
      ["inner2", "top"],
      ["top", "inner1"],
      ["inner1", "inner2"],
      ["inner2", "top"],
      ["top", "bottom"],
      ["bottom", "top"],
    ])
    for (const via of vias) {
      expect(via.layers).toHaveLength(4)
      expect(via.layers).toContain("top")
      expect(via.layers).toContain("inner1")
      expect(via.layers).toContain("inner2")
      expect(via.layers).toContain("bottom")
    }
  },
)
