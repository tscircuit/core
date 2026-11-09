import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSchematicTextBounds } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/getSchematicTextBounds"

test("schFlex sizes nested text-only groups from anchored, rotated notes", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group name="section" schFlex schFlexDirection="column" schGap={2}>
        <resistor name="R1" resistance="10k" footprint="0603" />
        <group name="notes">
          <group name="nested">
            <schematictext text="Power section" fontSize={0.3} anchor="left" />
            <schematictext
              text="3.3 V"
              fontSize={0.3}
              anchor="left"
              schRotation={90}
              schX={3}
            />
          </group>
        </group>
        <resistor name="R2" resistance="10k" footprint="0603" />
      </group>
    </board>,
  )
  circuit.render()

  const notes = circuit.db.schematic_group.getWhere({ name: "notes" })!
  expect(notes.width).toBeGreaterThan(0)
  expect(notes.height).toBeGreaterThan(0)
  for (const text of circuit.db.schematic_text.list()) {
    const bounds = getSchematicTextBounds(text)
    expect(bounds.minX).toBeGreaterThanOrEqual(
      notes.center.x - notes.width / 2 - 0.000001,
    )
    expect(bounds.maxX).toBeLessThanOrEqual(
      notes.center.x + notes.width / 2 + 0.000001,
    )
    expect(bounds.minY).toBeGreaterThanOrEqual(
      notes.center.y - notes.height / 2 - 0.000001,
    )
    expect(bounds.maxY).toBeLessThanOrEqual(
      notes.center.y + notes.height / 2 + 0.000001,
    )
  }
  for (const resistor of circuit.db.schematic_component.list()) {
    expect(Number.isFinite(resistor.center.x)).toBe(true)
    expect(Number.isFinite(resistor.center.y)).toBe(true)
    expect(Math.abs(resistor.center.y - notes.center.y)).toBeGreaterThan(
      notes.height / 2 + resistor.size.height / 2,
    )
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
