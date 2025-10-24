import { expect, test } from "bun:test"
import { Circuit } from "../../../index"

test("comprehensive color name support across components", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="20mm" height="20mm">
      {/* Test various schematic components with different color names */}
      <schematicrect schX={0} schY={0} width={1} height={1} color="red" />
      <schematicrect schX={2} schY={0} width={1} height={1} color="lime" />
      <schematicrect schX={4} schY={0} width={1} height={1} color="navy" />
      <schematiccircle
        center={{ x: 0, y: 2 }}
        radius={0.5}
        color="teal"
        fillColor="pink"
      />
      <schematicline x1={0} y1={4} x2={1} y2={4} color="maroon" />
      <schematictext schX={0} schY={6} text="Test" color="olive" />
      <schematicarc
        center={{ x: 0, y: 8 }}
        radius={0.5}
        startAngleDegrees={0}
        endAngleDegrees={180}
        color="coral"
      />

      {/* Test PCB note components */}
      <pcbnoterect pcbX={0} pcbY={0} width={1} height={1} color="crimson" />
      <pcbnoteline x1={0} y1={1} x2={1} y2={2} color="indigo" />
      <pcbnotetext pcbX={0} pcbY={3} text="Note" color="gold" />

      {/* Test fabrication note components */}
      <fabricationnoterect
        pcbX={2}
        pcbY={0}
        width={1}
        height={1}
        color="silver"
      />
      <fabricationnotetext pcbX={2} pcbY={1} text="Fab" color="turquoise" />

      {/* Test case insensitivity and extended colors */}
      <schematicrect schX={6} schY={0} width={1} height={1} color="DarkBlue" />
      <schematicrect
        schX={8}
        schY={0}
        width={1}
        height={1}
        color="LIGHTGREEN"
      />
      <schematicrect schX={10} schY={0} width={1} height={1} color="HotPink" />

      {/* Test that hex colors still work */}
      <schematicrect schX={0} schY={-2} width={1} height={1} color="#ff5733" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const schematicRects = circuitJson.filter(
    (item: any) => item.type === "schematic_rect",
  ) as any[]
  const schematicCircles = circuitJson.filter(
    (item: any) => item.type === "schematic_circle",
  ) as any[]
  const schematicLines = circuitJson.filter(
    (item: any) => item.type === "schematic_line",
  ) as any[]
  const schematicTexts = circuitJson.filter(
    (item: any) => item.type === "schematic_text",
  ) as any[]
  const schematicArcs = circuitJson.filter(
    (item: any) => item.type === "schematic_arc",
  ) as any[]
  const pcbNoteRects = circuitJson.filter(
    (item: any) => item.type === "pcb_note_rect",
  ) as any[]
  const pcbNoteLines = circuitJson.filter(
    (item: any) => item.type === "pcb_note_line",
  ) as any[]
  const pcbNoteTexts = circuitJson.filter(
    (item: any) => item.type === "pcb_note_text",
  ) as any[]
  const fabricationNoteRects = circuitJson.filter(
    (item: any) => item.type === "pcb_fabrication_note_rect",
  ) as any[]
  const fabricationNoteTexts = circuitJson.filter(
    (item: any) => item.type === "pcb_fabrication_note_text",
  ) as any[]

  // Test basic colors
  expect((schematicRects[0] as any).color).toBe("#ff0000") // red
  expect((schematicRects[1] as any).color).toBe("#00ff00") // lime
  expect((schematicRects[2] as any).color).toBe("#000080") // navy

  // Test circle with fill color
  expect((schematicCircles[0] as any).color).toBe("#008080") // teal
  expect((schematicCircles[0] as any).fill_color).toBe("#ffc0cb") // pink

  // Test other schematic components
  expect((schematicLines[0] as any).color).toBe("#800000") // maroon
  expect((schematicTexts[0] as any).color).toBe("#808000") // olive
  expect((schematicArcs[0] as any).color).toBe("#ff7f50") // coral

  // Test PCB note components
  expect((pcbNoteRects[0] as any).color).toBe("#dc143c") // crimson
  expect((pcbNoteLines[0] as any).color).toBe("#4b0082") // indigo
  expect((pcbNoteTexts[0] as any).color).toBe("#ffd700") // gold

  // Test fabrication note components
  expect((fabricationNoteRects[0] as any).color).toBe("#c0c0c0") // silver
  expect((fabricationNoteTexts[0] as any).color).toBe("#40e0d0") // turquoise

  // Test case insensitivity
  expect((schematicRects[3] as any).color).toBe("#00008b") // DarkBlue -> darkblue
  expect((schematicRects[4] as any).color).toBe("#90ee90") // LIGHTGREEN -> lightgreen
  expect((schematicRects[5] as any).color).toBe("#ff69b4") // HotPink -> hotpink

  // Test that hex colors are preserved
  expect((schematicRects[6] as any).color).toBe("#ff5733")
})

test("schematicbox with titleColor should support color names", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematicbox
        schX={0}
        schY={0}
        width={3}
        height={2}
        title="Test Box"
        titleColor="purple"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicTexts = circuitJson.filter(
    (item: any) => item.type === "schematic_text",
  ) as any[]

  // The title should be rendered as a schematic_text with purple color
  expect((schematicTexts[0] as any).text).toBe("Test Box")
  expect((schematicTexts[0] as any).color).toBe("#800080") // purple
})
