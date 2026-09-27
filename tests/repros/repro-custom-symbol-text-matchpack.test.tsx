import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom symbol labels follow their chips in automatic schematic layout", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board schAutoLayoutEnabled schLayout={{ matchAdapt: true }}>
      <schematicsheet name="Main" displayName="Main" sheetIndex={0}>
        <chip
          name="U1"
          symbol={
            <symbol>
              <schematicrect width={1.2} height={0.8} isFilled={false} />
              <schematictext text="MCU" fontSize={0.2} />
              <schematictext text="{REF}" fontSize={0.2} />
              <port name="RF" direction="right" />
            </symbol>
          }
        />
        <chip
          name="AE1"
          symbol={
            <symbol>
              <schematicrect width={0.8} height={0.5} isFilled={false} />
              <schematictext text="ANTENNA" fontSize={0.2} />
              <schematictext text="{REF}" fontSize={0.2} />
              <port name="RF" direction="left" />
            </symbol>
          }
        />
        <trace from="U1.RF" to="AE1.RF" />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  for (const [name, label] of [
    ["U1", "MCU"],
    ["AE1", "ANTENNA"],
  ] as const) {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    const schematicComponent = circuit.db.schematic_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const symbolText = circuit.db.schematic_text.getWhere({ text: label })!
    const referenceText = circuit.db.schematic_text.list().find(
      (text) => text.text === name && text.schematic_symbol_id,
    )!

    expect(symbolText.schematic_component_id).toBe(
      schematicComponent.schematic_component_id,
    )
    expect(symbolText.position).toEqual(schematicComponent.center)
    expect(referenceText.schematic_component_id).toBe(
      schematicComponent.schematic_component_id,
    )
  }
})
