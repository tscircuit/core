import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group anchor position", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
      <group
        name="Grouped Section"
        pcbPositionAnchor="top_left"
        pcbX="-3mm"
        pcbY="3mm"
      >
        <resistor
          name="RG1"
          pcbX="2mm"
          pcbY="0mm"
          footprint="0603"
          resistance="1k"
        />
        <resistor
          name="RG2"
          pcbX="3mm"
          pcbY="2mm"
          footprint="0603"
          resistance="2k"
        />
      </group>
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()
  const groupCircuitJson = circuitJson.find((elm) => elm.type === "pcb_group")
  expect(groupCircuitJson).toMatchInlineSnapshot(`
    {
      "anchor_alignment": "top_left",
      "anchor_position": {
        "x": -3,
        "y": 3,
      },
      "autorouter_configuration": undefined,
      "center": {
        "x": -3,
        "y": 3,
      },
      "display_offset_x": -3,
      "display_offset_y": 3,
      "height": 5,
      "is_subcircuit": undefined,
      "name": "Grouped Section",
      "pcb_component_ids": [],
      "pcb_group_id": "pcb_group_0",
      "position_mode": "relative_to_group_anchor",
      "positioned_relative_to_pcb_board_id": "pcb_board_0",
      "positioned_relative_to_pcb_group_id": undefined,
      "source_group_id": "source_group_0",
      "subcircuit_id": "subcircuit_source_group_1",
      "type": "pcb_group",
      "width": 5,
    }
  `)

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
    showPcbGroups: true,
  })
})
