import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel tooling holes and fiducials can be placed in the panel frame", () => {
  const { circuit } = getTestFixture()
  expect(() =>
    circuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board name="B1" width="14mm" height="18mm" routingDisabled>
          <pcbnotetext text="Panel fixtures" fontSize={0.6} />
        </board>
        <hole diameter="3mm" pcbX={-9.5} pcbY={-6} />
        <fiducial name="F1" padDiameter="1mm" pcbX={9.5} pcbY={6} />
      </panel>,
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `"<panel> can only contain <board>, <subpanel>, or <trace> elements"`,
  )
})
