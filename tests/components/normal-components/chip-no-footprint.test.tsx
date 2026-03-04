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

  // Should emit a pcb_missing_footprint_error
  const errors = circuitJson.filter(
    (el) => el.type === "pcb_missing_footprint_error",
  )
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain("No footprint specified for component:")
})
