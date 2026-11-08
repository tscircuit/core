import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schFlex geometry stays finite without the text-only child group", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={12} routingDisabled>
      <group name="section" schFlex schGap={2} pcbRelative>
        <resistor name="R1" resistance="10k" footprint="0603" pcbX={-4} />
        <resistor name="R2" resistance="10k" footprint="0603" pcbX={4} />
      </group>
    </board>,
  )

  circuit.render()

  for (const schematicComponent of circuit.db.schematic_component.list()) {
    expect(Number.isFinite(schematicComponent.center.x)).toBe(true)
    expect(Number.isFinite(schematicComponent.center.y)).toBe(true)
  }
  for (const schematicGroup of circuit.db.schematic_group.list()) {
    expect(Number.isFinite(schematicGroup.width)).toBe(true)
    expect(Number.isFinite(schematicGroup.height)).toBe(true)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
