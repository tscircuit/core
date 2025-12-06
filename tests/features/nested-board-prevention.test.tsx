import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested board prevention - should throw error when board is nested inside another board", () => {
  const { circuit } = getTestFixture()

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        <group>
          <board width="5mm" height="5mm" />
        </group>
      </board>,
    )
  }).toThrow(/Nested boards are not allowed/)
})
