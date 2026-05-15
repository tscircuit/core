import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("jlcpcb part number without prefix reports source_invalid_component_property_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" footprint="C2040" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const invalidPropErrors =
    circuit.db.source_invalid_component_property_error.list()
  const failedCreateErrors =
    circuit.db.source_failed_to_create_component_error.list()

  expect(failedCreateErrors).toHaveLength(0)
  expect(invalidPropErrors.length).toBeGreaterThan(0)

  const footprintErrors = invalidPropErrors.filter(
    (error) =>
      "property_name" in error &&
      error.property_name === "footprint" &&
      "message" in error,
  )

  expect(footprintErrors.length).toBeGreaterThan(0)
  expect(footprintErrors[0].message).toMatchInlineSnapshot(
    `"Invalid footprint prop on chip "U1": "C2040". If this is a JLCPCB part number, use "jlcpcb:C2040". Parser details: Invalid footprint function, got "c", from string "C2040""`,
  )
  expect(footprintErrors[0].message).toContain('chip "U1"')
  expect(footprintErrors[0].message).toContain("C2040")
  expect(footprintErrors[0].message).toContain("jlcpcb:C2040")
})
