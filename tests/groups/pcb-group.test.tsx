import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<pcbgroup> should render a pcb group and no special layout for schematic", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <pcbgroup name="G1" pcbX={-6}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
        <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={-1} />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      </pcbgroup>
      <resistor name="R2" resistance="1k" footprint="0402" />
    </board>,
  )

  circuit.render()

  const pcbGroups = circuit.db.pcb_group.list()
  expect(pcbGroups.length).toBe(1)
  expect(pcbGroups).toMatchInlineSnapshot(`
    [
      {
        "anchor_alignment": null,
        "anchor_position": {
          "x": -6,
          "y": 0,
        },
        "autorouter_configuration": undefined,
        "center": {
          "x": -6,
          "y": 0,
        },
        "display_offset_x": -6,
        "display_offset_y": undefined,
        "height": 0.64,
        "is_subcircuit": false,
        "name": "G1",
        "pcb_component_ids": [],
        "pcb_group_id": "pcb_group_0",
        "position_mode": "relative_to_group_anchor",
        "positioned_relative_to_pcb_board_id": "pcb_board_0",
        "positioned_relative_to_pcb_group_id": undefined,
        "source_group_id": "source_group_0",
        "subcircuit_id": "subcircuit_source_group_1",
        "type": "pcb_group",
        "width": 4.559999999999999,
      },
    ]
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
