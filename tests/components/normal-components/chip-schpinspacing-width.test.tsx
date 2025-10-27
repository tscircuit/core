import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getChipSchematicWidth = (schPinSpacing?: number) => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        schX={5}
        schY={5}
        schPortArrangement={{ leftSize: 4, rightSize: 4 }}
        {...(schPinSpacing !== undefined ? { schPinSpacing } : {})}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip")
  if (!chip) throw new Error("chip not found")

  const schematicComponent = circuit.db.schematic_component.get(
    chip.schematic_component_id!,
  )

  return schematicComponent?.size.width
}

test("chip schematic box width should not change when schPinSpacing is set", () => {
  const defaultWidth = getChipSchematicWidth()
  const customSpacingWidth = getChipSchematicWidth(0.75)

  expect(defaultWidth).toBeGreaterThan(0)
  expect(customSpacingWidth).toBeCloseTo(defaultWidth!)
})
