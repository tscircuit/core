import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor tolerance is included in Circuit JSON", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" tolerance="5%" />
    </board>,
  )
  circuit.render()

  expect(circuit.db.source_component.getWhere({ name: "R1" })).toMatchObject({
    resistance: 10_000,
    tolerance: 0.05,
  })
})
