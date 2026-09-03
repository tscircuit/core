import { expect, test } from "bun:test"
import { assembly } from "lib"
import type { RootCircuit } from "lib/RootCircuit"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getMissingSheetWarnings = (circuit: RootCircuit) =>
  circuit.db.schematic_component_styling_warning
    .list()
    .filter(
      (warning) => warning.styling_issue_type === "missing_schematic_sheet",
    )

test("warns when a schematic has no schematic sheet", async () => {
  const { circuit: circuitWithoutSheet } = getTestFixture()
  circuitWithoutSheet.add(
    <board routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )

  await circuitWithoutSheet.renderUntilSettled()

  expect(getMissingSheetWarnings(circuitWithoutSheet)).toEqual([
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

  expect(getMissingSheetWarnings(circuitWithSheet)).toEqual([])

  const { circuit: schematicDisabledCircuit } = getTestFixture()
  schematicDisabledCircuit.add(
    <board routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )

  await schematicDisabledCircuit.renderUntilSettled()

  expect(getMissingSheetWarnings(schematicDisabledCircuit)).toEqual([])

  const { circuit: assemblyCircuit } = getTestFixture()
  assemblyCircuit.add(
    <assembly.device name="controller">
      <board routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
    </assembly.device>,
  )

  await assemblyCircuit.renderUntilSettled()

  expect(getMissingSheetWarnings(assemblyCircuit)).toEqual([
    expect.objectContaining({
      styling_issue_type: "missing_schematic_sheet",
    }),
  ])
})
