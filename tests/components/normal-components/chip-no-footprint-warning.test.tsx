import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with no footprint should emit a warning", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Should emit a source_property_ignored_warning
  const warnings = circuitJson.filter(
    (el) => el.type === "source_property_ignored_warning",
  )
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toContain(
    'chip "U1" has no footprint prop and will not appear on the PCB.',
  )
})
