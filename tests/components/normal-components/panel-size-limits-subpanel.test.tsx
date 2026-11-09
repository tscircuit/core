import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("finished panel size limits cannot be silently ignored on a subpanel", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid">
      <subpanel minWidth="50mm">
        <board width="14mm" height="18mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  await expect(
    circuit.renderUntilSettled(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Panel size limits must be configured on the root <panel>"`,
  )
})
