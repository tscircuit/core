import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel silkscreen text can be placed in the panel frame", () => {
  const { circuit } = getTestFixture()
  expect(() =>
    circuit.add(
      <panel layoutMode="grid" edgePadding="5mm">
        <board name="B1" width="14mm" height="18mm" routingDisabled>
          <pcbnotetext text="Panel silkscreen" fontSize={0.6} />
        </board>
        <silkscreentext text="PANEL A / REV 1" pcbY={12} fontSize={0.8} />
      </panel>,
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `"<panel> can only contain <board>, <subpanel>, or <trace> elements"`,
  )
})
