import { expect, test } from "bun:test"
import { pcb_stackup } from "circuit-json"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("jlcpcbStackup selects the exact 4-layer 1.0mm JLC04101H-3313 construction over default 7628", async () => {
  const circuit = await getBoardStackupFixture({
    width: "100mm",
    height: "100mm",
    layers: 4,
    thickness: 1,
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-3313",
  })

  const stackups = circuit.db.pcb_stackup.list()
  expect(stackups).toHaveLength(1)
  const stackup = stackups[0]!
  expect(pcb_stackup.parse(stackup)).toEqual(stackup)
  expect(stackup.pcb_board_id).toBe(
    circuit.db.pcb_board.list()[0]!.pcb_board_id,
  )
  expect(stackup.layers).toHaveLength(7)
  expect(stackup.layers[1]).toMatchObject({
    layer_type: "dielectric",
    dielectric_type: "prepreg",
    material_name: "3313 RC57%",
    thickness: 0.0994,
    relative_permittivity: 4.1,
  })
  expect(
    circuit.db.source_invalid_component_property_error.list(),
  ).toHaveLength(0)
})

test("standalone jlcpcbStackup resolves case-insensitively and infers omitted layers and thickness", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    jlcpcbStackup: "jlc04101h-2116",
  })

  const board = circuit.db.pcb_board.list()[0]!
  expect(board.num_layers).toBe(4)
  expect(board.thickness).toBe(1)

  const stackups = circuit.db.pcb_stackup.list()
  expect(stackups).toHaveLength(1)
  expect(stackups[0]!.layers[1]).toMatchObject({
    layer_type: "dielectric",
    dielectric_type: "prepreg",
    material_name: "2116 RC54%",
    thickness: 0.124,
    relative_permittivity: 4.16,
  })
  expect(
    circuit.db.source_invalid_component_property_error.list(),
  ).toHaveLength(0)
})
