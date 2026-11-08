import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("omitted thickness defaults to 1.6mm with a JLC stackup", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    fabricatorPreset: "jlcpcb_standard",
    layers: 4,
    material: "fr4",
  })
  expect(circuit.db.pcb_board.list()[0]!.thickness).toBe(1.6)
  expect(circuit.db.pcb_stackup.list()).toHaveLength(1)
  expect(circuit.db.source_property_ignored_warning.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
