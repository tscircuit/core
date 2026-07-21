import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("library-style footprint without prefix reports source_invalid_component_property_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <capacitor
        name="C1"
        capacitance="1000pF"
        footprint="Crystal/Crystal_HC50_Vertical"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const invalidPropErrors =
    circuit.db.source_invalid_component_property_error.list()
  const failedCreateErrors =
    circuit.db.source_failed_to_create_component_error.list()

  expect(failedCreateErrors).toHaveLength(0)
  expect(invalidPropErrors.length).toBe(0)

  const footprintErrors = invalidPropErrors.filter(
    (error) =>
      "property_name" in error &&
      error.property_name === "footprint" &&
      "message" in error,
  )

  expect(footprintErrors.length).toBe(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
