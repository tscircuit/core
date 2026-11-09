import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel can only contain boards, subpanels, or traces", () => {
  const { circuit } = getTestFixture()

  expect(() =>
    circuit.add(
      <panel width="100mm" height="100mm">
        <subpanel width="50mm" height="50mm">
          <resistor name="R1" resistance={100} />
        </subpanel>
      </panel>,
    ),
  ).toThrow(
    "<subpanel> can only contain <board>, <subpanel>, or <trace> elements",
  )
})
