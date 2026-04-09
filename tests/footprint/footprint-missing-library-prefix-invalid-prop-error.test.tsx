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
  expect(invalidPropErrors.length).toBeGreaterThan(0)

  const footprintErrors = invalidPropErrors.filter(
    (error) =>
      "property_name" in error &&
      error.property_name === "footprint" &&
      "message" in error,
  )

  expect(footprintErrors.length).toBeGreaterThan(0)
  expect(footprintErrors[0].message).toMatchInlineSnapshot(
    `"Invalid footprint prop on capacitor "C1": "Crystal/Crystal_HC50_Vertical". If this is a KiCad footprint, use "kicad:Crystal/Crystal_HC50_Vertical". Parser details: Invalid footprint function, got "crystal", from string "Crystal/Crystal_HC50_Vertical""`,
  )
  expect(footprintErrors[0].message).toContain('capacitor "C1"')
  expect(footprintErrors[0].message).toContain("Crystal/Crystal_HC50_Vertical")
  expect(footprintErrors[0].message).toContain(
    "kicad:Crystal/Crystal_HC50_Vertical",
  )
})
