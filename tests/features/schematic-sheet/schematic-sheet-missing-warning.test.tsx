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
    circuitWithoutSheet.db.schematic_component_styling_warning
      .list()
      .filter(
        ({ styling_issue_type }) =>
          styling_issue_type === "missing_schematic_sheet",
      )
  expect(circuitWithoutSheetMissingSchematicSheetWarnings).toEqual([
    expect.objectContaining({
      warning_type: "schematic_component_styling_warning",
      styling_issue_type: "missing_schematic_sheet",
      message: expect.stringContaining("No <schematicsheet> was found"),
    }),
  ])

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
    circuitWithSheet.db.schematic_component_styling_warning
      .list()
      .filter(
        ({ styling_issue_type }) =>
          styling_issue_type === "missing_schematic_sheet",
      )
  expect(circuitWithSheetMissingSchematicSheetWarnings).toEqual([])

  const { circuit: schematicDisabledCircuit } = getTestFixture()
  schematicDisabledCircuit.add(
    <board routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )

  await schematicDisabledCircuit.renderUntilSettled()

  const schematicDisabledCircuitMissingSchematicSheetWarnings =
    schematicDisabledCircuit.db.schematic_component_styling_warning
      .list()
      .filter(
        ({ styling_issue_type }) =>
          styling_issue_type === "missing_schematic_sheet",
      )
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
    assemblyCircuit.db.schematic_component_styling_warning
      .list()
      .filter(
        ({ styling_issue_type }) =>
          styling_issue_type === "missing_schematic_sheet",
      )
  expect(assemblyCircuitMissingSchematicSheetWarnings).toEqual([
    expect.objectContaining({
      styling_issue_type: "missing_schematic_sheet",
    }),
  ])
})
