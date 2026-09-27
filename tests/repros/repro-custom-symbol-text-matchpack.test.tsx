import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import watchyAntennaSymbol from "tests/repros/assets/watchy-swra117d-symbol.circuit.json"

// Artwork imported from SQFMI Watchy's KiCad Device:Antenna_Chip symbol.
// This is the same SWRA117D symbol used on Watchy's ESP32 Core & RF sheet.
test("imported Watchy antenna labels follow MatchPack placement", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board schAutoLayoutEnabled schLayout={{ matchAdapt: true }}>
      <schematicsheet name="RF" displayName="ESP32 Core & RF" sheetIndex={0}>
        <resistor name="R1" resistance="50ohm" />
        <chip
          name="AE1"
          symbol={watchyAntennaSymbol as AnyCircuitElement[]}
          pinLabels={{ pin1: ["pin1", "1"], pin2: ["pin2", "2"] }}
        />
        <trace from="AE1.pin2" to="R1.pin1" />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  const withoutSheetFrame = circuit
    .getCircuitJson()
    .filter((element) => element.type !== "schematic_sheet")
  expect(withoutSheetFrame).toMatchSchematicSnapshot(import.meta.path)

  const sourceComponent = circuit.db.source_component.getWhere({ name: "AE1" })!
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
  })!

  for (const label of ["AE1", "SWRA117D Antenna"]) {
    const symbolText = circuit.db.schematic_text.getWhere({ text: label })!
    expect(symbolText).toBeDefined()
    expect(symbolText.schematic_component_id).toBe(
      schematicComponent.schematic_component_id,
    )
    expect(
      Math.abs(symbolText.position.x - schematicComponent.center.x),
    ).toBeLessThan(1)
    expect(
      Math.abs(symbolText.position.y - schematicComponent.center.y),
    ).toBeLessThan(1)
  }
})
