import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic sheet links schematic elements rendered inside it", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="Main Sheet"
        schematicSheetId="schematic_sheet_main"
        sheetIndex={1}
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          schX={0}
          schY={0}
        />
        <schematictext text="Sheet Label" schX={1} schY={1} />
      </schematicsheet>
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_sheet.get("schematic_sheet_main")).toMatchObject({
    schematic_sheet_id: "schematic_sheet_main",
    name: "Main Sheet",
  })

  const sourceComponent = circuit.db.source_component.getWhere({ name: "R1" })
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent?.source_component_id,
  })

  expect(schematicComponent).toMatchObject({
    schematic_sheet_id: "schematic_sheet_main",
  })

  expect(
    circuit.db.schematic_port
      .list()
      .filter(
        (port) =>
          port.schematic_component_id ===
          schematicComponent?.schematic_component_id,
      ),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        schematic_sheet_id: "schematic_sheet_main",
      }),
    ]),
  )

  expect(
    circuit.db.schematic_text.getWhere({ text: "Sheet Label" }),
  ).toMatchObject({
    schematic_sheet_id: "schematic_sheet_main",
  })
})
