import { expect, test } from "bun:test"
import {
  getBoardStackupFixture,
  getImportedBoardCircuitJson,
} from "tests/fixtures/get-board-stackup-fixture"

test("an ambiguous imported construction does not use a unique prop construction", async () => {
  const importedJson = getImportedBoardCircuitJson({
    num_layers: 4,
    thickness: 1,
    material: "fr4",
  })
  const originalJson = structuredClone(importedJson)
  const circuit = await getBoardStackupFixture({
    circuitJson: importedJson,
    layers: 4,
    thickness: "0.4mm",
    fabricatorPreset: "jlcpcb_standard",
  })
  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    num_layers: 4,
    thickness: 0.4,
  })
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(importedJson).toEqual(originalJson)
})
