import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("error when board nested inside board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <board>
        <resistor name="R1" resistance={100} />
      </board>
    </board>,
  )

  expect(() => circuit.render()).toThrow("Nested boards are not supported")
})
