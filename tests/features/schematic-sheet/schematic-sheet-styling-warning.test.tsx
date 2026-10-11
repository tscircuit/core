import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("only non-default schematic sheet sizes produce style warnings", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Default" />
      <schematicsheet name="Explicit A4" sheetSize="A4" />
      <schematicsheet
        name="Default dimensions"
        sheetWidth="297mm"
        sheetHeight="210mm"
      />
      <schematicsheet name="ANSI B" sheetSize="ANSI_B" />
      <schematicsheet name="Custom width" sheetWidth="500mm" />
      <schematicsheet name="Custom height" sheetHeight="300mm" />
      <schematicsheet
        name="Custom dimensions"
        displayName="Controller"
        sheetWidth="500mm"
        sheetHeight="300mm"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings = circuit
    .getCircuitJson()
    .filter((element) => element.type === "schematic_sheet_styling_warning")
  const sheets = circuit.db.schematic_sheet.list()
  expect(warnings).toHaveLength(4)
  expect(warnings.map((warning) => warning.schematic_sheet_id)).toEqual(
    sheets.slice(3).map((sheet) => sheet.schematic_sheet_id),
  )
  expect(warnings[3]).toMatchObject({
    warning_type: "schematic_sheet_styling_warning",
    styling_issue_type: "non_default_sheet_size",
    message:
      'Schematic sheet "Controller" uses a non-default size (500 × 300 mm). Prefer the default A4 sheet size (297 × 210 mm) for consistent schematic styling.',
  })
  await circuit.renderUntilSettled()
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type === "schematic_sheet_styling_warning"),
  ).toEqual(warnings)

  const { circuit: disabledCircuit } = getTestFixture()
  disabledCircuit.add(
    <board schematicDisabled>
      <schematicsheet name="Disabled" sheetWidth="500mm" />
    </board>,
  )
  await disabledCircuit.renderUntilSettled()
  expect(
    disabledCircuit
      .getCircuitJson()
      .filter((element) => element.type === "schematic_sheet_styling_warning"),
  ).toHaveLength(0)
})
