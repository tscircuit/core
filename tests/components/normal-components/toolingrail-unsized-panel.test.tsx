import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a <toolingrail> needs a panel with a known size", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="pack" edgePadding="5mm">
      <board name="B1" width="14mm" height="18mm" routingDisabled />
      <toolingrail panelSide="left" width="5mm" />
    </panel>,
  )

  await expect(
    circuit.renderUntilSettled(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<toolingrail> needs a panel with a known size. Use layoutMode="grid" or set the panel width and height."`,
  )
})
