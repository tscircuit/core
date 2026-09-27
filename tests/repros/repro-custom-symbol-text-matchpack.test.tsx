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
              <schematicrect width={1.8} height={0.8} isFilled={false} />
              <schematictext text="{REF} MCU" fontSize={0.18} />
              <port name="RF" direction="right" />
            </symbol>
          }
        />
        <chip
          name="AE1"
          symbol={
            <symbol>
              <schematicrect width={2.5} height={0.8} isFilled={false} />
              <schematictext text="{REF} ANTENNA" fontSize={0.18} />
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
    ["U1", "U1 MCU"],
    ["AE1", "AE1 ANTENNA"],
  ] as const) {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    const schematicComponent = circuit.db.schematic_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const symbolText = circuit.db.schematic_text.getWhere({ text: label })!

    expect(symbolText.schematic_component_id).toBe(
      schematicComponent.schematic_component_id,
    )
    expect(symbolText.position).toEqual(schematicComponent.center)
  }
})
