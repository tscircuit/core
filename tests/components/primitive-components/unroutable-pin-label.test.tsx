import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinLabels naming a pin the footprint lacks emits an invalid-property error", async () => {
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
  expect(errors).toHaveLength(1)
  expect(errors[0]?.property_name).toBe("pinLabels")
  expect(errors[0]?.message).toContain("Z")
})

test("a component with no footprint does not error for unmapped ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <solderjumper name="SJ1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_invalid_component_property_error.list()).toHaveLength(
    0,
  )
})
