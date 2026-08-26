import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { SchematicSheet } from "lib/components/primitive-components/SchematicSheet"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import batteryPowerSheetCircuitJson from "tests/repros/assets/repro173-battery-power-sheet.json"

test(
  "reproduces battery power schematic extending past the sheet frame",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board routingDisabled>
        <schematicsheet
          name="battery_power"
          displayName="Battery Power"
          sheetIndex={2}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const schematicSheetComponent = circuit.firstChild?.children.find(
      (child) => child instanceof SchematicSheet,
    )
    const schematicSheet = circuit.db.schematic_sheet.getWhere({
      name: "battery_power",
    })
    if (!schematicSheetComponent || !schematicSheet) {
      throw new Error("Battery power schematic sheet was not rendered")
    }

    // Preserve the uploaded geometry while linking it to the TSX-created sheet.
    for (const schematicElement of batteryPowerSheetCircuitJson) {
      if (schematicElement.type === "schematic_sheet") continue
      const parsedSchematicElement = any_circuit_element.parse(schematicElement)

      switch (parsedSchematicElement.type) {
        case "schematic_component":
        case "schematic_line":
        case "schematic_net_label":
        case "schematic_path":
        case "schematic_port":
        case "schematic_text":
        case "schematic_trace":
          circuit.db.insert({
            ...parsedSchematicElement,
            schematic_sheet_id: schematicSheet.schematic_sheet_id,
          })
          break
        case "schematic_symbol":
          circuit.db.insert(parsedSchematicElement)
          break
        default:
          throw new Error(
            `Unsupported battery power schematic element: ${parsedSchematicElement.type}`,
          )
      }
    }

    schematicSheetComponent.doInitialSchematicSheetRender()

    expect(circuit.db.schematic_component.list()).toHaveLength(18)
    expect(schematicSheet).not.toHaveProperty("center")
    await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
  },
  { timeout: 30_000 },
)
