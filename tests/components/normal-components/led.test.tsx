import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("led should show clear error when missing footprint", () => {
  const { circuit } = getTestFixture()

  // Add LED without footprint
  circuit.add(
    <board width="10mm" height="10mm">
      <led name="test-led" />
    </board>,
  )

  circuit.render()

  // Get the error from the database
  const db = circuit.db
  const errors = db.pcb_missing_footprint_error.list()

  // Should have exactly one error
  expect(errors.length).toBe(1)

  const error = errors[0]

  // Verify error message is clear about missing footprint
  expect(error.message).toBe(
    'led is missing required footprint prop. Please add a footprint prop to define the component\'s PCB layout, e.g. <led footprint="..." />',
  )
  expect(error.error_type).toBe("pcb_missing_footprint_error")
})
