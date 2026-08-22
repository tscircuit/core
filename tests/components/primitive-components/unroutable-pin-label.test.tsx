import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinLabels naming a pin the footprint lacks emits source_invalid_component_property_error (#2863)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: ["A"], pin99: ["Z"] }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_invalid_component_property_error.list()
  expect(errors.length).toBe(1)
  expect(errors[0]?.property_name).toBe("pinLabels")
  expect(errors[0]?.message).toContain("Z")
})

test("component with no footprint does not emit error for unmapped ports (#2863)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <solderjumper name="SJ1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_invalid_component_property_error.list()
  expect(errors.length).toBe(0)
})
