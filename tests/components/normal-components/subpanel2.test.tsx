import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel must contain at least one board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel width="50mm" height="50mm">
        {/* intentionally empty */}
      </subpanel>
    </panel>,
  )

  expect(() => {
    circuit.render()
  }).toThrow("<subpanel> must contain at least one <board>")
})
