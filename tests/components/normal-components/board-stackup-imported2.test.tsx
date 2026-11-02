import { expect, test } from "bun:test"
import {
  getBoardStackupFixture,
  getImportedBoardCircuitJson,
} from "tests/fixtures/get-board-stackup-fixture"

test("an imported FR-4 board resolves its construction", async () => {
  const circuit = await getBoardStackupFixture({
    circuitJson: getImportedBoardCircuitJson({
      num_layers: 4,
      thickness: 0.4,
      material: "fr4",
    }),
    fabricatorPreset: "jlcpcb_standard",
  })
  const stackups = circuit.db.pcb_stackup.list()
  expect(circuit.db.pcb_board.list()).toHaveLength(1)
  expect(stackups).toHaveLength(1)
  expect(stackups[0]).toMatchObject({
    pcb_board_id: circuit.db.pcb_board.list()[0]!.pcb_board_id,
    layers: expect.arrayContaining([
      {
        layer_type: "copper",
        layer: "inner1",
        thickness: 0.0152,
        electrical_conductivity_s_per_m: 5.8e7,
      },
    ]),
  })
})
