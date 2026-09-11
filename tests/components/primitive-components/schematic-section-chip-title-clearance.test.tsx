import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("section titles clear chip and schematic-box reference labels", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="display" sheetIndex={1}>
        <schematicsection name="lcd" displayName="RGB666 LCD" />
      </schematicsheet>
      <schematicsheet name="supply" sheetIndex={2}>
        <schematicsection
          name="power"
          displayName="Power"
          sectionTitleFontSize={0.4}
        />
      </schematicsheet>
      <chip
        name="SOC_U1A"
        manufacturerPartNumber="F1C100S"
        schSectionName="lcd"
        schSheetName="display"
        schX={-3}
        schY={0}
        schWidth={2}
        schHeight={4}
        pinLabels={{ pin1: "LCD_D2", pin2: "LCD_D3" }}
      />
      <chip
        name="SOC_U1"
        noSchematicRepresentation
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
      />
      <schematicbox
        name="SOC_U1G"
        chipRef=".SOC_U1"
        schSectionName="power"
        schSheetName="supply"
        schX={3}
        schY={0}
        width={2}
        height={4}
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
      />
    </board>,
  )
  circuit.render()

  for (const [title, reference] of [
    ["RGB666 LCD", "SOC_U1A"],
    ["Power", "SOC_U1G"],
  ]) {
    const titleText = circuit.db.schematic_text
      .list()
      .find((t) => t.text === title)!
    const referenceText = circuit.db.schematic_text
      .list()
      .find((t) => t.text === reference)!
    // Compare the emitted top-anchored title bottom with the centered reference top.
    expect(titleText.position.y - titleText.font_size).toBeGreaterThan(
      referenceText.position.y + referenceText.font_size / 2,
    )
  }
  expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
