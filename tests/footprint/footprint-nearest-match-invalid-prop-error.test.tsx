import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mistyped footprint name suggests the nearest match", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" footprint="slide_switch_smd" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const invalidPropErrors =
    circuit.db.source_invalid_component_property_error.list()

  const footprintErrors = invalidPropErrors.filter(
    (error) =>
      "property_name" in error &&
      error.property_name === "footprint" &&
      "message" in error,
  )

  expect(footprintErrors.length).toBeGreaterThan(0)
  expect(footprintErrors[0].message).toContain('Did you mean "smdslideswitch"?')
})
