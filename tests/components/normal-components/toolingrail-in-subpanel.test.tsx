import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a <toolingrail> cannot be placed inside a <subpanel>", () => {
  const { circuit } = getTestFixture()
  expect(() =>
    circuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <subpanel layoutMode="grid">
          <board name="B1" width="14mm" height="18mm" routingDisabled />
          <toolingrail panelSide="left" width="5mm" />
        </subpanel>
      </panel>,
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `"<subpanel> can only contain <board>, <subpanel>, <trace>, <hole>, or <fiducial> elements"`,
  )
})
