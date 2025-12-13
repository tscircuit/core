import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("error when board deeply nested inside board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group>
        <group>
          <board>
            <resistor name="R1" resistance={100} />
          </board>
        </group>
      </group>
    </board>,
  )

  expect(() => circuit.render()).toThrow("Nested boards are not supported")
})
