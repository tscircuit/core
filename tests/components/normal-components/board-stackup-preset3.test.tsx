import { expect, test } from "bun:test"
import { pcb_stackup } from "circuit-json"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("jlcpcb_economy_20260912 resolves the sourced JLC04041H-3313 construction", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: "0.4mm",
    fabricatorPreset: "jlcpcb_economy_20260912",
  })
  const stackups = circuit.db.pcb_stackup.list()
  expect(stackups).toHaveLength(1)
  const stackup = stackups[0]!
  expect(pcb_stackup.parse(stackup)).toEqual(stackup)
  expect(stackup.pcb_board_id).toBe(
    circuit.db.pcb_board.list()[0]!.pcb_board_id,
  )
  expect(stackup.layers).toHaveLength(7)
  expect(stackup.layers[1]).toMatchObject({ material_name: "3313 RC57%" })
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
