import { expect, test } from "bun:test"
import { jlc04101h7628Stackup } from "@tscircuit/jlcpcb-manufacturing-specs"
import { pcb_stackup } from "circuit-json"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("jlcpcbStackup selects JLC04101H-7628 for 4-layer 1.0mm FR-4 board", async () => {
  const circuit = await getBoardStackupFixture({
    width: "100mm",
    height: "100mm",
    layers: 4,
    thickness: 1,
    material: "fr4",
    fabricatorPreset: "jlcpcb_standard",
    jlcpcbStackup: "JLC04101H-7628",
  })
  const stackups = circuit.db.pcb_stackup.list()
  expect(stackups).toHaveLength(1)
  const stackup = stackups[0]!
  expect(pcb_stackup.parse(stackup)).toEqual(stackup)
  expect(stackup.layers).toEqual(jlc04101h7628Stackup.layers)
  expect(stackup.layers[1]).toMatchObject({
    material_name: "7628 RC49%",
    thickness: 0.2104,
    relative_permittivity: 4.4,
  })
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
