import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor polarized", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="10µF"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        polarized
        connections={{
          pos: "net.POS",
          neg: "net.NEG",
        }}
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{
    ftype: "simple_capacitor"
    display_capacitance?: string
  }>

  expect(capacitors).toHaveLength(1)
  expect(capacitors[0].display_capacitance).toBe("10µF")
  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
