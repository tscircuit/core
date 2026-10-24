import { expect, test } from "bun:test"
import {
  getBoardStackupFixture,
  getImportedBoardCircuitJson,
} from "tests/fixtures/get-board-stackup-fixture"

test("an imported board defaults to 1.4mm without guessing an ambiguous stackup", async () => {
  const circuit = await getBoardStackupFixture({
    circuitJson: getImportedBoardCircuitJson({
      num_layers: 8,
      thickness: undefined,
    }),
    fabricatorPreset: "jlcpcb_standard",
    layers: 8,
  })
  expect(circuit.db.pcb_board.list()[0]!.thickness).toBe(1.4)
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
