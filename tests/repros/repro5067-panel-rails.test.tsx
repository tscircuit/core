import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a tooling rail sits in the panel edge padding", () => {
  const { circuit } = getTestFixture()
  expect(() =>
    circuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board name="B1" width="14mm" height="18mm" routingDisabled>
          <pcbnotetext text="Panel rails" fontSize={0.6} />
        </board>
        {createElement(
          "toolingrail",
          { name: "LEFT_RAIL", panelSide: "left", width: "5mm" },
          <pcbnotetext text="LEFT RAIL" pcbRotation={90} fontSize={0.6} />,
        )}
      </panel>,
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Unsupported component type "toolingrail". No element with this name is registered in the @tscircuit/core catalogue. Check for typos or see https://docs.tscircuit.com/category/built-in-elements for a list of valid components. To add your own component, see docs/CREATING_NEW_COMPONENTS.md"`,
  )
})
