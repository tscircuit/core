import { expect, test } from "bun:test"
import {
  getBoardStackupFixture,
  getImportedBoardCircuitJson,
} from "tests/fixtures/get-board-stackup-fixture"

test("an imported board without a preset emits no stackup", async () => {
  const circuit = await getBoardStackupFixture({
    circuitJson: getImportedBoardCircuitJson({
      num_layers: 4,
      thickness: 1.6,
      material: "fr4",
    }),
  })
  const stackups = circuit.db.pcb_stackup.list()
  expect(circuit.db.pcb_board.list()).toHaveLength(1)
  expect(stackups).toHaveLength(0)
})
