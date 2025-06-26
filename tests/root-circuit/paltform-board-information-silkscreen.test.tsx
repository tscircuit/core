import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board information silkscreen added from platform config", async () => {
  const { circuit } = getTestFixture({
    platform: {
      projectName: "TestProj",
      version: "1.0.0",
      url: "https://example.com",
      printBoardInformationToSilkscreen: true,
    },
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_silkscreen_text.list()[1]).toMatchInlineSnapshot(`
    {
      "anchor_alignment": "bottom_right",
      "anchor_position": {
        "x": 4.75,
        "y": -4,
      },
      "ccw_rotation": 0,
      "font": "tscircuit2024",
      "font_size": 0.45,
      "layer": "top",
      "pcb_component_id": null,
      "pcb_silkscreen_text_id": "pcb_silkscreen_text_1",
      "text": 
    "TestProj
    v1.0.0
    https://example.com"
    ,
      "type": "pcb_silkscreen_text",
    }
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})