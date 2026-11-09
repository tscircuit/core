import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("vScore rejects tabs on curved board outlines", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" panelizationMethod="tab-routing" vScore>
      <board width="14mm" height="18mm" borderRadius="2mm" routingDisabled />
    </panel>,
  )

  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "V-scored panel tabs require straight board edges",
  )
})
