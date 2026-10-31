import { expect, test } from "bun:test"
import { getSchematicTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import {
  SCHEMATIC_SHEET_INNER_MARGIN,
  SCHEMATIC_UNIT_TO_MM,
} from "lib/utils/schematic/warn-if-schematic-elements-outside-sheet"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic sections wrap within the A4 drawing area", async () => {
  const { circuit } = getTestFixture()
  const capacitors = { A: 12, B: 8, C: 8, D: 4, E: 4 }
  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <schematicsheet name="main" displayName="Main">
        <schematicsection name="A" displayName="Section A" />
        <schematicsection name="B" displayName="Section B" />
        <schematicsection name="C" displayName="Section C" />
        <schematicsection name="D" displayName="Section D" />
        <schematicsection name="E" displayName="Section E" />
      </schematicsheet>
      {Object.entries(capacitors).flatMap(([section, count], sectionIndex) => [
        <chip
          key={`U${section}`}
          name={`U${sectionIndex + 1}`}
          footprint="soic16"
          schSheetName="main"
          schSectionName={section}
        />,
        ...Array.from({ length: count }, (_, index) => {
          const name = `C${100 * sectionIndex + index + 1}`
          return [
            <capacitor
              key={name}
              name={name}
              capacitance="1uF"
              footprint="0603"
              schSheetName="main"
              schSectionName={section}
            />,
            <trace
              key={`${name}a`}
              from={`.U${sectionIndex + 1} > .pin${index + 1}`}
              to={`.${name} > .pin1`}
            />,
            <trace key={`${name}b`} from={`.${name} > .pin2`} to="net.GND" />,
          ]
        }).flat(),
      ])}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.schematic_element_outside_sheet_warning.list(),
  ).toHaveLength(0)
  // The warning covers components, labels and traces, but not section
  // dividers or text. Check their emitted bounds against the drawing frame too.
  const sheet = circuit.db.schematic_sheet.list()[0]!
  // The sheet renderer stores center at runtime, although the current
  // circuit-json sheet type does not yet expose it.
  const centerX =
    (sheet as typeof sheet & { center?: { x: number } }).center?.x ?? 0
  const halfDrawingWidth =
    sheet.sheet_width! / (2 * SCHEMATIC_UNIT_TO_MM) -
    SCHEMATIC_SHEET_INNER_MARGIN
  const minX = centerX - halfDrawingWidth
  const maxX = centerX + halfDrawingWidth
  for (const line of circuit.db.schematic_line.list()) {
    if (line.schematic_sheet_id !== sheet.schematic_sheet_id) continue
    expect(Math.min(line.x1, line.x2)).toBeGreaterThanOrEqual(minX - 1e-6)
    expect(Math.max(line.x1, line.x2)).toBeLessThanOrEqual(maxX + 1e-6)
  }
  for (const text of circuit.db.schematic_text.list()) {
    if (text.schematic_sheet_id !== sheet.schematic_sheet_id) continue
    const bounds = getSchematicTextBounds({
      text: text.text,
      position: text.position,
      anchor: text.anchor,
      fontSize: text.font_size,
    })
    expect(bounds.minX).toBeGreaterThanOrEqual(minX - 1e-6)
    expect(bounds.maxX).toBeLessThanOrEqual(maxX + 1e-6)
  }
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
