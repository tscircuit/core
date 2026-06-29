import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"

test("schematic sheet links schematic component with direct schSheetName", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="Main Sheet"
        displayName="Main Sheet"
        sheetIndex={0}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schX={0}
        schY={0}
        schSheetName="Main Sheet"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicSheet = circuit.db.schematic_sheet.getWhere({
    name: "Main Sheet",
  })
  const schematicSheetId = schematicSheet?.schematic_sheet_id

  const sourceComponent = circuit.db.source_component.getWhere({ name: "R1" })
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent?.source_component_id,
  })

  expect(schematicComponent).toMatchObject({
    schematic_sheet_id: schematicSheetId,
  })

  const sheetElements = [
    ...circuit.db.schematic_component.list(),
    ...circuit.db.schematic_port.list(),
    ...circuit.db.schematic_text.list(),
    ...circuit.db.schematic_line.list(),
    ...circuit.db.schematic_rect.list(),
    ...circuit.db.schematic_circle.list(),
    ...circuit.db.schematic_arc.list(),
    ...circuit.db.schematic_path.list(),
  ].filter(
    (element) => (element as any).schematic_sheet_id === schematicSheetId,
  )
  const bounds = getBoundsForSchematic(sheetElements)
  expect((schematicSheet as any)?.center).toEqual({
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  })

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
