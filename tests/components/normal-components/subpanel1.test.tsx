import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel rejects ordinary components outside child boards", () => {
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
    "<subpanel> can only contain <board>, <subpanel>, <trace>, <toolingrail>, <hole>, <fiducial>, or silkscreen elements",
  )
})
