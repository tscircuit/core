import { expect, test } from "bun:test"
import {
  getBoardStackupFixture,
  getImportedBoardCircuitJson,
} from "tests/fixtures/get-board-stackup-fixture"

test("imported 2-layer 1.5mm fr4 construction takes precedence over board props", async () => {
  const circuit = await getBoardStackupFixture({
    circuitJson: getImportedBoardCircuitJson({
      num_layers: 2,
      thickness: 1.5,
      material: "fr4",
    }),
    fabricatorPreset: "jlcpcb_standard",
    layers: 4,
    thickness: "1.6mm",
    material: "fr4",
  })
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
