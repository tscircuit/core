import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("negative schematic dimensions emit source_invalid_component_property_error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" footprint="soic8" schWidth={-4} schHeight={3} />
      <schematicbox width={-2} height={2} schX={6} schY={0} />
      <schematicrect width={-3} height={1} schX={10} schY={0} />
      <schematiccircle
        center={{ x: 0, y: 0 }}
        radius={-1}
        schX={14}
        schY={0}
      />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.source_invalid_component_property_error.list()

  expect(errors.map(({ property_name }) => property_name).sort()).toEqual([
    "radius",
    "schWidth",
    "width",
    "width",
  ])

  for (const error of errors) {
    expect(error.error_type).toBe("source_invalid_component_property_error")
    expect(error.message).toMatch(/must be greater than zero/)
  }
})
