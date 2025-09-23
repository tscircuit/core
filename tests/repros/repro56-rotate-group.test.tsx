import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotate group and have traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      <group name="G0" pcbRotation="0deg" pcbX={-18}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-1} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={1} />
      </group>

      <group name="G1" pcbRotation="45deg">
        <resistor name="R3" resistance="1k" footprint="0402" pcbX={-1} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbX={1} />
      </group>

      <trace from="G0.R1 > .pin1" to="G1.R3 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const pcb_trace = circuitJson.filter((c) => c.type === "pcb_trace")
  expect(pcb_trace.length).toBe(1)

  const pcb_silkscreen_text = circuitJson.filter((c) => c.type === "pcb_silkscreen_text")
  expect(pcb_silkscreen_text).toMatchInlineSnapshot(`
    [
      {
        "anchor_alignment": "center",
        "anchor_position": {
          "x": -19,
          "y": 1.22,
        },
        "ccw_rotation": 0,
        "font": "tscircuit2024",
        "font_size": 0.4,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": "pcb_group_0",
        "pcb_silkscreen_text_id": "pcb_silkscreen_text_0",
        "subcircuit_id": "subcircuit_source_group_2",
        "text": "R1",
        "type": "pcb_silkscreen_text",
      },
      {
        "anchor_alignment": "center",
        "anchor_position": {
          "x": -17,
          "y": 1.22,
        },
        "ccw_rotation": 0,
        "font": "tscircuit2024",
        "font_size": 0.4,
        "layer": "top",
        "pcb_component_id": "pcb_component_1",
        "pcb_group_id": "pcb_group_0",
        "pcb_silkscreen_text_id": "pcb_silkscreen_text_1",
        "subcircuit_id": "subcircuit_source_group_2",
        "text": "R2",
        "type": "pcb_silkscreen_text",
      },
      {
        "anchor_alignment": "center",
        "anchor_position": {
          "x": -1.5697770542341356,
          "y": 0.15556349186104057,
        },
        "ccw_rotation": 0,
        "font": "tscircuit2024",
        "font_size": 0.4,
        "layer": "top",
        "pcb_component_id": "pcb_component_2",
        "pcb_group_id": "pcb_group_1",
        "pcb_silkscreen_text_id": "pcb_silkscreen_text_2",
        "subcircuit_id": "subcircuit_source_group_2",
        "text": "R3",
        "type": "pcb_silkscreen_text",
      },
      {
        "anchor_alignment": "center",
        "anchor_position": {
          "x": -0.15556349186104035,
          "y": 1.5697770542341356,
        },
        "ccw_rotation": 0,
        "font": "tscircuit2024",
        "font_size": 0.4,
        "layer": "top",
        "pcb_component_id": "pcb_component_3",
        "pcb_group_id": "pcb_group_1",
        "pcb_silkscreen_text_id": "pcb_silkscreen_text_3",
        "subcircuit_id": "subcircuit_source_group_2",
        "text": "R4",
        "type": "pcb_silkscreen_text",
      },
    ]
  `)
  
  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
