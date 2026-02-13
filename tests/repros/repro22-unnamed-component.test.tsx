import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip renders with default name when none provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      {/* @ts-expect-error - name is not required */}
      <resistor resistance={1000} footprint="0402" />
    </board>,
  )

  circuit.render()

  const source_component = circuit.db.source_component.list()[0]
  expect(source_component.name).toMatchInlineSnapshot(`"R1"`)
  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_failed_to_create_component_error")
  expect(errors).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
