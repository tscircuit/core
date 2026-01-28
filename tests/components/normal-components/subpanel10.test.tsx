import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel warns when boards have manual positioning in grid mode", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel layoutMode="grid">
        <board name="B1" width="10mm" height="10mm" routingDisabled pcbX={5} />
        <board name="B2" width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const warnings = circuitJson.filter(
    (element) =>
      "error_type" in element &&
      element.error_type === "source_property_ignored_warning",
  )

  expect(warnings.length).toBeGreaterThanOrEqual(1)
})
