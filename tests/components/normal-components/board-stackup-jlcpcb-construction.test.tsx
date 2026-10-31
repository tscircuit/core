import { expect, test } from "bun:test"
import { pcb_stackup } from "circuit-json"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("jlcpcbStackup selects the exact named 4-layer 1.0mm construction (JLC04101H-3313)", async () => {
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
  expect(stackup.layers).toHaveLength(7)
  expect(stackup.layers[1]).toMatchObject({
    layer_type: "dielectric",
    dielectric_type: "prepreg",
    material_name: "3313 RC57%",
    thickness: 0.0994,
    relative_permittivity: 4.1,
  })
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})

test("jlcpcbStackup selects JLC04101H-1080 and JLC04101H-2116 for 4-layer 1.0mm boards", async () => {
  const circuit1080 = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: 1,
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-1080",
  })
  expect(circuit1080.db.pcb_stackup.list()[0]!.layers[1]).toMatchObject({
    material_name: "1080 RC67%",
    thickness: 0.0764,
    relative_permittivity: 3.91,
  })

  const circuit2116 = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: 1,
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-2116",
  })
  expect(circuit2116.db.pcb_stackup.list()[0]!.layers[1]).toMatchObject({
    material_name: "2116 RC54%",
    thickness: 0.124,
    relative_permittivity: 4.16,
  })
})

test("mismatched jlcpcbStackup for a different thickness emits no stackup", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: 1.6,
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-3313",
  })

  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
