import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("unsupported 6-layer 1.5mm fr4 construction emits no stackup or error", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    fabricatorPreset: "jlcpcb_standard",
    layers: 6,
    thickness: 1.5,
    material: "fr4",
  })
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
