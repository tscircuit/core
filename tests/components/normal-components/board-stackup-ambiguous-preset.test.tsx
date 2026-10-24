import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("ambiguous JLC constructions do not emit a guessed stackup", async () => {
  for (const fabricatorPreset of [
    "jlcpcb_economy",
    "jlcpcb_standard",
    "jlcpcb_economy_20260912",
    "jlcpcb_standard_20260912",
  ] as const) {
    const circuit = await getBoardStackupFixture({
      width: 100,
      height: 100,
      layers: 4,
      thickness: "1mm",
      material: "fr4",
      fabricatorPreset,
    })
    expect(circuit.db.pcb_board.list()[0]).toMatchObject({
      num_layers: 4,
      thickness: 1,
      material: "fr4",
    })
    expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
    expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  }
})
