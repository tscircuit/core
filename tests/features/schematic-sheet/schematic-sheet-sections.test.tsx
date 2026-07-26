import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic sections render independently on each sheet", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <schematicsheet name="power" displayName="Power" sheetIndex={1}>
        <schematicsection name="input" displayName="Input" />
        <schematicsection name="regulation" displayName="Regulation" />
      </schematicsheet>

      <schematicsheet name="control" displayName="Control" sheetIndex={2}>
        <schematicsection name="logic" displayName="Logic" />
        <schematicsection name="output" displayName="Output" />
      </schematicsheet>

      <resistor
        name="R_INPUT"
        resistance="1k"
        footprint="0402"
        schX={-3}
        schSheetName="power"
        schSectionName="input"
      />
      <capacitor
        name="C_REGULATION"
        capacitance="1uF"
        footprint="0402"
        schX={3}
        schSheetName="power"
        schSectionName="regulation"
      />

      <chip
        name="U_LOGIC"
        footprint="soic4"
        schX={-3}
        schSheetName="control"
        schSectionName="logic"
      />
      <led
        name="D_OUTPUT"
        footprint="0603"
        schX={3}
        schSheetName="control"
        schSectionName="output"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sheetsByName = new Map(
    circuitJson
      .filter((element) => element.type === "schematic_sheet")
      .map((sheet) => [sheet.name, sheet.schematic_sheet_id]),
  )
  const sectionTitlesBySheet = new Map<string, Set<string>>()
  const expectedSectionTitles = new Set([
    "Input",
    "Regulation",
    "Logic",
    "Output",
  ])

  for (const element of circuitJson) {
    if (element.type !== "schematic_text") continue
    if (!element.schematic_sheet_id) continue
    if (!expectedSectionTitles.has(element.text)) continue
    const titles =
      sectionTitlesBySheet.get(element.schematic_sheet_id) ?? new Set<string>()
    titles.add(element.text)
    sectionTitlesBySheet.set(element.schematic_sheet_id, titles)
  }

  expect(sectionTitlesBySheet.get(sheetsByName.get("power")!)).toEqual(
    new Set(["Input", "Regulation"]),
  )
  expect(sectionTitlesBySheet.get(sheetsByName.get("control")!)).toEqual(
    new Set(["Logic", "Output"]),
  )
  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
