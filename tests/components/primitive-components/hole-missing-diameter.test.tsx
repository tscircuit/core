import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<hole> without a resolvable size fails with a clear error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <hole name="H1" pcbX={-2} pcbY={1} />
    </board>,
  )

  expect(() => circuit.render()).toThrow(/diameter/)
})
