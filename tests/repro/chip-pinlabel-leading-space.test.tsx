import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Reproduce issue with pin label containing trailing space

test("chip pinLabels should not allow leading or trailing spaces", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" pinLabels={{ pin1: ["A1 "] }} />
    </board>,
  )

  circuit.render()

  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_failed_to_create_component_error")

  expect(errors[0].message).toMatch(
    /pinLabels\.pin1 \("A1 " has leading or trailing spaces\)/,
  )
})
