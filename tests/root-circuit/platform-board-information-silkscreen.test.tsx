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
      "anchor_alignment": "center",
      "anchor_position": {
        "x": 3,
        "y": 1.22,
      },
      "ccw_rotation": 0,
      "font": "tscircuit2024",
      "font_size": 0.4,
      "layer": "top",
      "pcb_component_id": "pcb_component_0",
      "pcb_group_id": undefined,
      "pcb_silkscreen_text_id": "pcb_silkscreen_text_1",
      "subcircuit_id": "subcircuit_source_group_0",
      "text": "R1",
      "type": "pcb_silkscreen_text",
    }
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
