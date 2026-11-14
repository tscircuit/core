import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Issue #4800: without solderPasteMargin the paste aperture should match the
// pad (margin 0), not shrink to 0.7x the pad width and height. The 0603 pads
// here are 0.8 x 0.95 mm.
test("default solder paste aperture matches the pad", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={6} height={4}>
      <resistor name="R1" resistance="1k" footprint="0603" />
    </board>,
  )
  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
  expect(circuit.db.pcb_solder_paste.list()).toMatchInlineSnapshot(`
    [
      {
        "height": 0.6649999999999999,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": undefined,
        "pcb_smtpad_id": "pcb_smtpad_0",
        "pcb_solder_paste_id": "pcb_solder_paste_0",
        "shape": "rect",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_solder_paste",
        "width": 0.5599999999999999,
        "x": -0.825,
        "y": 0,
      },
      {
        "height": 0.6649999999999999,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": undefined,
        "pcb_smtpad_id": "pcb_smtpad_1",
        "pcb_solder_paste_id": "pcb_solder_paste_1",
        "shape": "rect",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_solder_paste",
        "width": 0.5599999999999999,
        "x": 0.825,
        "y": 0,
      },
    ]
  `)
})
