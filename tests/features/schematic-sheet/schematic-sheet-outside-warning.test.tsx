import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type SchematicElementOutsideSheetWarningRecord = {
  type: "schematic_element_outside_sheet_warning"
  schematic_element_type:
    | "schematic_component"
    | "schematic_net_label"
    | "schematic_trace"
}

test("warns when components, net labels, and traces extend outside a schematic sheet", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="Main Sheet"
        displayName="Main Sheet"
        sheetIndex={0}
      />
      <group name="OUTSIDE_SHEET_CONTENT" schSheetName="Main Sheet">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          schX={-17}
          schY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          schX={17}
          schY={0}
        />
        <netlabel net="OUTSIDE_TOP" schX={0} schY={12} anchorSide="bottom" />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.db.toArray() as unknown as Array<
    AnyCircuitElement | SchematicElementOutsideSheetWarningRecord
  >
  const warnings = circuitJson.filter(
    (element): element is SchematicElementOutsideSheetWarningRecord =>
      element.type === "schematic_element_outside_sheet_warning",
  )
  expect(
    warnings.map((warning) => warning.schematic_element_type).sort(),
  ).toEqual([
    "schematic_component",
    "schematic_component",
    "schematic_net_label",
    "schematic_trace",
  ])

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
