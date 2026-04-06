import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with invalid pinLabels key fails with a clear error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="soic8" pinLabels={{ A1: "VCC" }} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((el) => el.type === "source_failed_to_create_component_error")

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain(
    'Invalid pinLabels key "A1". Expected "pin<number>" (e.g. pin1, pin2).',
  )
})
