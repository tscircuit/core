import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an empty schFlex child group does not produce infinite bounds", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group schFlex schGap={2}>
        <resistor name="R1" resistance="10k" footprint="0603" />
        <group name="empty" />
        <resistor name="R2" resistance="10k" footprint="0603" />
      </group>
    </board>,
  )
  circuit.render()
  for (const resistor of circuit.db.schematic_component.list()) {
    expect(Number.isFinite(resistor.center.x)).toBe(true)
    expect(Number.isFinite(resistor.center.y)).toBe(true)
  }
  for (const group of circuit.db.schematic_group.list()) {
    expect(Number.isFinite(group.width)).toBe(true)
    expect(Number.isFinite(group.height)).toBe(true)
    expect(Number.isFinite(group.center.x)).toBe(true)
    expect(Number.isFinite(group.center.y)).toBe(true)
  }
})
