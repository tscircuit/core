import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotate silkscreen text ccw", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <jumper
        name="JP6"
        pinLabels={{
          pin1: ["GND"],
          pin2: ["VOUT"],
        }}
        footprint="pinrow2_p2.54_id1.016_od1.88_nosquareplating_pinlabeltextalignleft_pinlabelorthogonal"
        pcbRotation={90}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const pcb_silkscreen_text = circuitJson.filter(
    (c) => c.type === "pcb_silkscreen_text",
  )
  expect(pcb_silkscreen_text).toMatchInlineSnapshot(`
    [
      {
        "anchor_alignment": "center_left",
        "anchor_position": {
          "x": 1.41,
          "y": -1.27,
        },
        "ccw_rotation": 90,
        "font": "tscircuit2024",
        "font_size": 0.5760000000000001,
        "is_knockout": undefined,
        "knockout_padding": undefined,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": undefined,
        "pcb_silkscreen_text_id": "pcb_silkscreen_text_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "text": "GND",
        "type": "pcb_silkscreen_text",
      },
      {
        "anchor_alignment": "center_left",
        "anchor_position": {
          "x": 1.41,
          "y": 1.27,
        },
        "ccw_rotation": 90,
        "font": "tscircuit2024",
        "font_size": 0.5760000000000001,
        "is_knockout": undefined,
        "knockout_padding": undefined,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": undefined,
        "pcb_silkscreen_text_id": "pcb_silkscreen_text_1",
        "subcircuit_id": "subcircuit_source_group_0",
        "text": "VOUT",
        "type": "pcb_silkscreen_text",
      },
      {
        "anchor_alignment": "center",
        "anchor_position": {
          "x": -2.54,
          "y": 0.00000000000000015553014349171386,
        },
        "ccw_rotation": 90,
        "font": "tscircuit2024",
        "font_size": 0.7,
        "is_knockout": undefined,
        "knockout_padding": undefined,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": undefined,
        "pcb_silkscreen_text_id": "pcb_silkscreen_text_2",
        "subcircuit_id": "subcircuit_source_group_0",
        "text": "JP6",
        "type": "pcb_silkscreen_text",
      },
    ]
  `)

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
