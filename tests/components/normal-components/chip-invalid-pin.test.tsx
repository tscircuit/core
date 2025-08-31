import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with invalid pin should be skipped", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "VIN",
          pin3: "//",
          pin4: "VOUT",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const source_property_ignored_warning = circuit
    .getCircuitJson()
    .filter((el) => el.type === "source_property_ignored_warning")

  expect(source_property_ignored_warning).toHaveLength(1)
  expect(source_property_ignored_warning[0].message).toContain(
    "Invalid pin label: pin3 = '//' - excluding from component. Please use a valid pin label.",
  )

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
