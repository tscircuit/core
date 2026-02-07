import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const boardSize = { width: "10mm", height: "10mm" }

test("pinheader pcbOrientation vertical places pins vertically", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board {...boardSize}>
      <pinheader name="J1" pinCount={2} pcbOrientation="vertical" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const pcb_silkscreen_text = circuitJson.filter(
    (c) => c.type === "pcb_silkscreen_text",
  )
  expect(pcb_silkscreen_text).toMatchInlineSnapshot(`
    [
      {
        "anchor_alignment": "center",
        "anchor_position": {
          "x": 2.54,
          "y": 0.00000000000000015553014349171386,
        },
        "ccw_rotation": -90,
        "font": "tscircuit2024",
        "font_size": 0.7,
        "is_knockout": undefined,
        "knockout_padding": undefined,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": undefined,
        "pcb_silkscreen_text_id": "pcb_silkscreen_text_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "text": "J1",
        "type": "pcb_silkscreen_text",
      },
    ]
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
