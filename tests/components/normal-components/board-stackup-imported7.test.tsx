import { expect, test } from "bun:test"
import {
  getBoardStackupFixture,
  getImportedBoardCircuitJson,
} from "tests/fixtures/get-board-stackup-fixture"

test("imported 4-layer 1.6mm flex construction takes precedence over board props", async () => {
  const circuit = await getBoardStackupFixture({
    circuitJson: getImportedBoardCircuitJson({
      num_layers: 4,
      thickness: 1.6,
      material: "flex",
    }),
    fabricatorPreset: "jlcpcb_standard",
    layers: 4,
    thickness: "1.6mm",
    material: "fr4",
  })
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
