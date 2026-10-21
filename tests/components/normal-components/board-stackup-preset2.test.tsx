import { expect, test } from "bun:test"
import { pcb_stackup } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("jlcpcb_standard resolves the sourced JLC04161H-3313 construction", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={20}
      layers={4}
      thickness="1.6mm"
      fabricatorPreset="jlcpcb_standard"
    />,
  )
  await circuit.renderUntilSettled()
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
