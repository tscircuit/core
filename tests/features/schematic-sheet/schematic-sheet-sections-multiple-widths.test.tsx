import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("section rows use each sheet's drawing width even with reused section names", async () => {
  const { circuit } = getTestFixture()
  const sectionNames = ["A", "B", "C"]
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="narrow" sheetWidth="90mm" sheetHeight="210mm">
        <schematicsection name="A" displayName="Narrow A" />
        <schematicsection name="B" displayName="Narrow B" />
        <schematicsection name="C" displayName="Narrow C" />
      </schematicsheet>
      <schematicsheet name="wide" sheetWidth="297mm" sheetHeight="210mm">
        <schematicsection name="A" displayName="Wide A" />
        <schematicsection name="B" displayName="Wide B" />
        <schematicsection name="C" displayName="Wide C" />
      </schematicsheet>
      {["narrow", "wide"].flatMap((sheet) =>
        sectionNames.map((section) => (
          <resistor
            key={`${sheet}-${section}`}
            name={`${sheet}_${section}`}
            resistance="1k"
            footprint="0402"
            schSheetName={sheet}
            schSectionName={section}
          />
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  const position = (name: string) => {
    const source = circuit.db.source_component
      .list()
      .find((component) => component.name === name)
    expect(source).toBeDefined()
    return circuit.db.schematic_component.getWhere({
      source_component_id: source!.source_component_id,
    })!.center
  }
  expect(position("narrow_A").y).not.toBe(position("narrow_C").y)
  expect(position("wide_A").y).toBe(position("wide_C").y)
  expect(
    circuit.db.schematic_element_outside_sheet_warning.list(),
  ).toHaveLength(0)
  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
