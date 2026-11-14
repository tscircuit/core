import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Issue #4800: a board's defaultSolderPasteMargin sets the paste margin of
// every pad that does not set its own solderPasteMargin. R1's 0603 pads are
// 0.8 x 0.95 mm, so a margin of 0 gives paste the size of each pad; U1's pad
// keeps its own -0.1 mm margin.
test("board defaultSolderPasteMargin sets the paste margin of its pads", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={4} defaultSolderPasteMargin={0}>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-2} />
      <chip
        name="U1"
        pcbX={2}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1}
              height={1}
              portHints={["1"]}
              solderPasteMargin={-0.1}
            />
          </footprint>
        }
      />
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
        "x": -2.825,
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
        "x": -1.175,
        "y": 0,
      },
      {
        "height": 0.8,
        "layer": "top",
        "pcb_component_id": "pcb_component_1",
        "pcb_group_id": undefined,
        "pcb_smtpad_id": "pcb_smtpad_2",
        "pcb_solder_paste_id": "pcb_solder_paste_2",
        "shape": "rect",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_solder_paste",
        "width": 0.8,
        "x": 2,
        "y": 0,
      },
    ]
  `)
})
