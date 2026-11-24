import { expect, test } from "bun:test"
import { pcb_stackup } from "circuit-json"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("jlcpcbStackup selects the named construction among matching 4-layer 1.0mm FR-4 stackups", async () => {
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
  expect(stackup.layers[1]).toMatchObject({
    layer_type: "dielectric",
    dielectric_type: "prepreg",
    material_name: "3313 RC57%",
    thickness: 0.0994,
    relative_permittivity: 4.1,
  })
  expect(circuit.db.source_property_ignored_warning.list()).toHaveLength(0)
})
