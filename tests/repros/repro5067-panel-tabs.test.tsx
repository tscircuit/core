import { expect, test } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel tab count and keepouts control where tabs are placed", () => {
  const { circuit } = getTestFixture()
  expect(() =>
    circuit.add(
      <panel
        layoutMode="grid"
        panelizationMethod="tab-routing"
        tabLength="3mm"
        tabCountPerEdge={2}
      >
        <board name="B1" width="20mm" height="20mm" routingDisabled>
          <pcbnotetext text="2 tabs/edge; top keepout 0–7 mm" fontSize={0.6} />
        </board>
        {createElement("paneltabkeepout", {
          boardName: "B1",
          boardEdge: "top",
          from: "0mm",
          to: "7mm",
        })}
      </panel>,
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Unsupported component type "paneltabkeepout". No element with this name is registered in the @tscircuit/core catalogue. Check for typos or see https://docs.tscircuit.com/category/built-in-elements for a list of valid components. To add your own component, see docs/CREATING_NEW_COMPONENTS.md"`,
  )
})
