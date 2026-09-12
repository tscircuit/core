import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns when a schematic has no schematic sheet", async () => {
  const { circuit: circuitWithoutSheet } = getTestFixture()
  circuitWithoutSheet.add(
    <board routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )

  await circuitWithoutSheet.renderUntilSettled()

  const circuitWithoutSheetMissingSchematicSheetWarnings =
    circuitWithoutSheet.db.schematic_missing_sheet_warning.list()
  expect(circuitWithoutSheetMissingSchematicSheetWarnings).toEqual([
    expect.objectContaining({
      warning_type: "schematic_missing_sheet_warning",
      type: "schematic_missing_sheet_warning",
      message: expect.stringContaining("No <schematicsheet> was found"),
    }),
  ])

  const warning = circuitWithoutSheetMissingSchematicSheetWarnings[0]!
  expect(warning).not.toHaveProperty("schematic_component_id")
  expect(warning).not.toHaveProperty("source_component_id")
  expect(warning).not.toHaveProperty("subcircuit_id")
  expect(
    circuitWithoutSheet.db.schematic_component_styling_warning.list(),
  ).not.toContainEqual(
    expect.objectContaining({ styling_issue_type: "missing_schematic_sheet" }),
  )

  const { circuit: circuitWithSheet } = getTestFixture()
  circuitWithSheet.add(
    <board routingDisabled>
      <schematicsheet name="Main Sheet" displayName="Main Sheet" sheetIndex={0}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </schematicsheet>
    </board>,
  )

  await circuitWithSheet.renderUntilSettled()

  const circuitWithSheetMissingSchematicSheetWarnings =
    circuitWithSheet.db.schematic_missing_sheet_warning.list()
  expect(circuitWithSheetMissingSchematicSheetWarnings).toEqual([])

  const { circuit: schematicDisabledCircuit } = getTestFixture()
  schematicDisabledCircuit.add(
    <board routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )

  await schematicDisabledCircuit.renderUntilSettled()

  const schematicDisabledCircuitMissingSchematicSheetWarnings =
    schematicDisabledCircuit.db.schematic_missing_sheet_warning.list()
  expect(schematicDisabledCircuitMissingSchematicSheetWarnings).toEqual([])

  const { circuit: assemblyCircuit } = getTestFixture()
  assemblyCircuit.add(
    <assembly.device name="controller">
      <board routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
    </assembly.device>,
  )

  await assemblyCircuit.renderUntilSettled()

  const assemblyCircuitMissingSchematicSheetWarnings =
    assemblyCircuit.db.schematic_missing_sheet_warning.list()
  expect(assemblyCircuitMissingSchematicSheetWarnings).toEqual([
    expect.objectContaining({
      type: "schematic_missing_sheet_warning",
    }),
  ])
})
