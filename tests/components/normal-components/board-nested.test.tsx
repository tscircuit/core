import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("error when board nested inside board", () => {
  const { circuit } = getTestFixture()

  expect(() =>
    circuit.add(
      <board>
        <board>
          <resistor name="R1" resistance={100} />
        </board>
      </board>,
    ),
  ).toThrow("Nested boards are not allowed")
})
