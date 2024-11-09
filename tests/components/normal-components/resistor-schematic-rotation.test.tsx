import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor with schematic rotation", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={0}
        schRotation="90deg"
      />
    </board>,
  )

  project.render()

  const schematicComponent = project.db.schematic_component.list()[0]
  expect(schematicComponent.rotation).toBe(90)

  // Check if ports are positioned correctly after rotation
  const schemPorts = project.db.schematic_port.list()
  expect(schemPorts).toHaveLength(2)

  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
