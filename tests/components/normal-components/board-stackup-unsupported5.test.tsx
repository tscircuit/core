import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("unsupported 4-layer 1.6mm fr1 construction emits no stackup or error", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    fabricatorPreset: "jlcpcb_standard",
    layers: 4,
    thickness: 1.6,
    material: "fr1",
  })
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
