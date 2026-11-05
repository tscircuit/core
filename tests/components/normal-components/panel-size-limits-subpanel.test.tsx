import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("finished panel size limits cannot be silently ignored on a subpanel", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid">
      {createElement(
        "subpanel",
        { minWidth: "50mm" },
        <board width="14mm" height="18mm" routingDisabled />,
      )}
    </panel>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "Panel size limits must be configured on the root <panel>",
  )
})
