import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("explicit unsupported 4-layer 1.4mm thickness warns that no stackup was emitted", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    fabricatorPreset: "jlcpcb_standard",
    layers: 4,
    thickness: 1.4,
    material: "fr4",
  })
  expect(circuit.db.pcb_board.list()[0]!.thickness).toBe(1.4)
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  const warnings = circuit.db.source_property_ignored_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.property_name).toBe("fabricatorPreset")
  expect(warnings[0]!.message).toMatchInlineSnapshot(`"fabricatorPreset "jlcpcb_standard" has no stackup template for a 4-layer 1.4mm fr4 board, so no pcb_stackup was emitted. Supported thicknesses for 4-layer fr4: 0.4mm, 0.6mm, 0.8mm, 1mm, 1.2mm, 1.6mm, 1.8mm, 2mm, 2.5mm, 3mm. Set thickness on <board> to one of these."`)
})
