import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduce alphanumeric pin number error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="USB1"
        pinLabels={{
          GND_A: "GND_A",
        }}
      />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain(
    'Invalid props for port "GND_A": pinNumber (Expected number, received nan)',
  )
})
