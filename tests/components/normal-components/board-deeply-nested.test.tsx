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

  // Nesting a board at any depth is not supported, but it should be surfaced
  // as a source error rather than crashing the entire render.
  expect(() => circuit.render()).not.toThrow()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors.length).toBe(1)
  expect(errors[0].message).toContain("Nested boards are not supported")
})
