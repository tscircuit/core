import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Test that primitive elements (silkscreen, fab notes, pcb notes) are properly
 * inflated when loading a subcircuit from circuit JSON.
 */
test("primitive elements should be inflated from circuitJson", async () => {
  // First, render a circuit with various primitive elements to get circuit JSON
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="30mm" height="30mm">
      {/* Silkscreen primitives */}
      <silkscreenrect
        pcbX={-10}
        pcbY={10}
        width={4}
        height={2}
        layer="top"
        strokeWidth={0.15}
      />
      <silkscreencircle pcbX={-5} pcbY={10} radius={1.5} layer="top" />
      <silkscreenline
        x1={0}
        y1={8}
        x2={5}
        y2={12}
        layer="top"
        strokeWidth={0.2}
      />
      <silkscreenpath
        route={[
          { x: 8, y: 8 },
          { x: 10, y: 10 },
          { x: 12, y: 8 },
        ]}
        layer="top"
        strokeWidth={0.15}
      />
      <silkscreentext pcbX={-10} pcbY={5} text="SILK" fontSize={1} />

      {/* Fabrication note primitives */}
      <fabricationnotetext
        pcbX={-10}
        pcbY={0}
        text="FAB NOTE"
        fontSize={0.8}
        color="blue"
      />
      <fabricationnoterect
        pcbX={-5}
        pcbY={0}
        width={3}
        height={2}
        strokeWidth={0.1}
        color="green"
      />
      <fabricationnotepath
        route={[
          { x: 0, y: -1 },
          { x: 2, y: 1 },
          { x: 4, y: -1 },
        ]}
        strokeWidth={0.15}
        color="red"
      />

      {/* PCB note primitives */}
      <pcbnotetext
        pcbX={-10}
        pcbY={-8}
        text="PCB NOTE"
        fontSize={0.8}
        color="purple"
      />
      <pcbnoterect
        pcbX={-5}
        pcbY={-8}
        width={3}
        height={2}
        strokeWidth={0.1}
        color="orange"
      />
      <pcbnotepath
        route={[
          { x: 0, y: -9 },
          { x: 2, y: -7 },
          { x: 4, y: -9 },
        ]}
        strokeWidth={0.15}
        color="cyan"
      />
      <pcbnoteline
        x1={6}
        y1={-9}
        x2={10}
        y2={-7}
        strokeWidth={0.2}
        color="magenta"
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  // Verify source circuit has no errors
  const sourceJson = sourceCircuit.getCircuitJson()
  const sourceErrors = sourceJson.filter((elm) => elm.type.includes("error"))
  expect(sourceErrors).toHaveLength(0)

  // Verify all primitive elements exist in the source JSON
  const silkscreenRects = sourceJson.filter(
    (elm) => elm.type === "pcb_silkscreen_rect",
  )
  const silkscreenCircles = sourceJson.filter(
    (elm) => elm.type === "pcb_silkscreen_circle",
  )
  const silkscreenLines = sourceJson.filter(
    (elm) => elm.type === "pcb_silkscreen_line",
  )
  const silkscreenPaths = sourceJson.filter(
    (elm) => elm.type === "pcb_silkscreen_path",
  )
  const silkscreenTexts = sourceJson.filter(
    (elm) => elm.type === "pcb_silkscreen_text",
  )
  const fabNoteTexts = sourceJson.filter(
    (elm) => elm.type === "pcb_fabrication_note_text",
  )
  const fabNoteRects = sourceJson.filter(
    (elm) => elm.type === "pcb_fabrication_note_rect",
  )
  const fabNotePaths = sourceJson.filter(
    (elm) => elm.type === "pcb_fabrication_note_path",
  )
  const pcbNoteTexts = sourceJson.filter((elm) => elm.type === "pcb_note_text")
  const pcbNoteRects = sourceJson.filter((elm) => elm.type === "pcb_note_rect")
  const pcbNotePaths = sourceJson.filter((elm) => elm.type === "pcb_note_path")
  const pcbNoteLines = sourceJson.filter((elm) => elm.type === "pcb_note_line")

  expect(silkscreenRects.length).toBe(1)
  expect(silkscreenCircles.length).toBe(1)
  expect(silkscreenLines.length).toBe(1)
  expect(silkscreenPaths.length).toBe(1)
  expect(silkscreenTexts.length).toBe(1)
  expect(fabNoteTexts.length).toBe(1)
  expect(fabNoteRects.length).toBe(1)
  expect(fabNotePaths.length).toBe(1)
  expect(pcbNoteTexts.length).toBe(1)
  expect(pcbNoteRects.length).toBe(1)
  expect(pcbNotePaths.length).toBe(1)
  expect(pcbNoteLines.length).toBe(1)

  // Snapshot the original circuit
  expect(sourceCircuit).toMatchPcbSnapshot(`${import.meta.path}-original`)

  // Now inflate the circuit JSON in a new subcircuit
  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board width="30mm" height="30mm">
      <subcircuit name="Inflated" circuitJson={sourceJson as CircuitJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  // Check for errors
  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  // Verify all primitive elements were inflated
  const inflatedSilkscreenRects = targetJson.filter(
    (elm) => elm.type === "pcb_silkscreen_rect",
  )
  const inflatedSilkscreenCircles = targetJson.filter(
    (elm) => elm.type === "pcb_silkscreen_circle",
  )
  const inflatedSilkscreenLines = targetJson.filter(
    (elm) => elm.type === "pcb_silkscreen_line",
  )
  const inflatedSilkscreenPaths = targetJson.filter(
    (elm) => elm.type === "pcb_silkscreen_path",
  )
  const inflatedSilkscreenTexts = targetJson.filter(
    (elm) => elm.type === "pcb_silkscreen_text",
  )
  const inflatedFabNoteTexts = targetJson.filter(
    (elm) => elm.type === "pcb_fabrication_note_text",
  )
  const inflatedFabNoteRects = targetJson.filter(
    (elm) => elm.type === "pcb_fabrication_note_rect",
  )
  const inflatedFabNotePaths = targetJson.filter(
    (elm) => elm.type === "pcb_fabrication_note_path",
  )
  const inflatedPcbNoteTexts = targetJson.filter(
    (elm) => elm.type === "pcb_note_text",
  )
  const inflatedPcbNoteRects = targetJson.filter(
    (elm) => elm.type === "pcb_note_rect",
  )
  const inflatedPcbNotePaths = targetJson.filter(
    (elm) => elm.type === "pcb_note_path",
  )
  const inflatedPcbNoteLines = targetJson.filter(
    (elm) => elm.type === "pcb_note_line",
  )

  expect(inflatedSilkscreenRects.length).toBe(1)
  expect(inflatedSilkscreenCircles.length).toBe(1)
  expect(inflatedSilkscreenLines.length).toBe(1)
  expect(inflatedSilkscreenPaths.length).toBe(1)
  expect(inflatedSilkscreenTexts.length).toBe(1)
  expect(inflatedFabNoteTexts.length).toBe(1)
  expect(inflatedFabNoteRects.length).toBe(1)
  expect(inflatedFabNotePaths.length).toBe(1)
  expect(inflatedPcbNoteTexts.length).toBe(1)
  expect(inflatedPcbNoteRects.length).toBe(1)
  expect(inflatedPcbNotePaths.length).toBe(1)
  expect(inflatedPcbNoteLines.length).toBe(1)

  // Verify specific properties are preserved for key elements
  const sourceSilkRect = silkscreenRects[0]
  const inflatedSilkRect = inflatedSilkscreenRects[0]
  expect(inflatedSilkRect.width).toBe(sourceSilkRect.width)
  expect(inflatedSilkRect.height).toBe(sourceSilkRect.height)
  expect(inflatedSilkRect.layer).toBe(sourceSilkRect.layer)

  const sourceSilkCircle = silkscreenCircles[0]
  const inflatedSilkCircle = inflatedSilkscreenCircles[0]
  expect(inflatedSilkCircle.radius).toBe(sourceSilkCircle.radius)

  const sourceFabText = fabNoteTexts[0]
  const inflatedFabText = inflatedFabNoteTexts[0]
  expect(inflatedFabText.text).toBe(sourceFabText.text)
  expect(inflatedFabText.color).toBe(sourceFabText.color)

  const sourcePcbNoteLine = pcbNoteLines[0]
  const inflatedPcbNoteLine = inflatedPcbNoteLines[0]
  expect(inflatedPcbNoteLine.color).toBe(sourcePcbNoteLine.color)

  // Snapshot the inflated circuit - should look the same as original
  expect(targetCircuit).toMatchPcbSnapshot(`${import.meta.path}-inflated`)
})
