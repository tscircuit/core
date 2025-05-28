import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor schematic", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  project.render()

  expect(project.db.schematic_component.list()).toHaveLength(1)
  expect(project.db.schematic_port.list()).toHaveLength(2)
  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
