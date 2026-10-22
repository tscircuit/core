import { expect, test } from "bun:test"
import { jlc08141h1080Stackup } from "@tscircuit/jlcpcb-manufacturing-specs"
import {
  getBoardStackupFixture,
  getImportedBoardCircuitJson,
} from "tests/fixtures/get-board-stackup-fixture"

test("an imported board without thickness resolves its default 1.4mm stackup", async () => {
  const circuit = await getBoardStackupFixture({
    circuitJson: getImportedBoardCircuitJson({
      num_layers: 8,
      thickness: undefined,
    }),
    fabricatorPreset: "jlcpcb_standard",
    layers: 8,
  })
  expect(circuit.db.pcb_board.list()[0]!.thickness).toBe(1.4)
  expect(circuit.db.pcb_stackup.list()).toMatchObject([
    { layers: jlc08141h1080Stackup.layers },
  ])
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
