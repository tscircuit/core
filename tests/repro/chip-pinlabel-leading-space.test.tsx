import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pinLabels should not allow leading or trailing spaces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" pinLabels={{ pin1: ["A1 "] }} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematic_errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_property_ignored_warning")

  expect(schematic_errors).toHaveLength(1)
  expect(schematic_errors[0].message).toContain(
    "Invalid pin label: pin1 = 'A1 ' - excluding from component. Please use a valid pin label.",
  )
})
