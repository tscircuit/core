import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel errors when multiple boards without positions in none mode", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel layoutMode="none">
        <board name="B1" width="10mm" height="10mm" routingDisabled />
        <board name="B2" width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter(
    (element) =>
      "error_type" in element && element.error_type === "pcb_placement_error",
  )

  expect(errors.length).toBeGreaterThanOrEqual(1)
})
