import { expect, test } from "bun:test"
import { pcb_stackup } from "circuit-json"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("jlcpcb_economy resolves the sourced JLC04161H-3313 construction", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: "1.6mm",
    fabricatorPreset: "jlcpcb_economy",
  })
  const stackups = circuit.db.pcb_stackup.list()
  expect(stackups).toHaveLength(1)
  const stackup = stackups[0]!
  expect(pcb_stackup.parse(stackup)).toEqual(stackup)
  expect(stackup.pcb_board_id).toBe(
    circuit.db.pcb_board.list()[0]!.pcb_board_id,
  )
  expect(stackup.layers).toEqual([
    {
      layer_type: "copper",
      layer: "top",
      thickness: 0.035,
      electrical_conductivity_s_per_m: 5.8e7,
    },
    {
      layer_type: "dielectric",
      dielectric_type: "prepreg",
      material_name: "3313 RC57%",
      thickness: 0.0994,
      relative_permittivity: 4.1,
    },
    {
      layer_type: "copper",
      layer: "inner1",
      thickness: 0.0152,
      electrical_conductivity_s_per_m: 5.8e7,
    },
    {
      layer_type: "dielectric",
      dielectric_type: "core",
      material_name: "NP-155F core",
      thickness: 1.265,
      relative_permittivity: 4.42,
    },
    {
      layer_type: "copper",
      layer: "inner2",
      thickness: 0.0152,
      electrical_conductivity_s_per_m: 5.8e7,
    },
    {
      layer_type: "dielectric",
      dielectric_type: "prepreg",
      material_name: "3313 RC57%",
      thickness: 0.0994,
      relative_permittivity: 4.1,
    },
    {
      layer_type: "copper",
      layer: "bottom",
      thickness: 0.035,
      electrical_conductivity_s_per_m: 5.8e7,
    },
  ])
  expect(
    stackup.layers.reduce((sum, layer) => sum + (layer.thickness ?? 0), 0),
  ).toBeCloseTo(1.5642)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
