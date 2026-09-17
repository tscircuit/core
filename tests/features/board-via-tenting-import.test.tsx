import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported board tenting is preserved unless defaultViaTenting overrides it", async () => {
  const { circuit } = getTestFixture()
  const circuitJson: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_imported",
      center: { x: 0, y: 0 },
      width: 24,
      height: 10,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
      default_via_tented_on_top: true,
      default_via_tented_on_bottom: false,
    },
    {
      type: "pcb_via",
      pcb_via_id: "pcb_via_imported",
      x: 0,
      y: 0,
      hole_diameter: 0.6,
      outer_diameter: 1.2,
      layers: ["top", "bottom"],
    },
  ]
  circuit.add(
    <panel width={52} height={18}>
      <board name="Imported" pcbX={-13} circuitJson={circuitJson} />
      <board
        name="Override"
        pcbX={13}
        circuitJson={circuitJson}
        defaultViaTenting={false}
      />
    </panel>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()).toMatchObject([
    { default_via_tented_on_top: true, default_via_tented_on_bottom: false },
    { default_via_tented_on_top: false, default_via_tented_on_bottom: false },
  ])
  expect(circuit.db.pcb_via.list()).toMatchObject([
    { tented_on_top: undefined, tented_on_bottom: undefined },
    { tented_on_top: undefined, tented_on_bottom: undefined },
  ])
  circuit.db.pcb_note_text.insert({
    text: "Imported: top: true, bottom: false",
    anchor_position: { x: -13, y: 3 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.6,
  })
  circuit.db.pcb_note_text.insert({
    text: "Override false: both exposed",
    anchor_position: { x: 13, y: 3 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.6,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    layer: "top",
    width: 1200,
    height: 450,
  })
})
