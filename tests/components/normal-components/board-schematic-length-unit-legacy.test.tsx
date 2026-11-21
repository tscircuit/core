import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("omitting defaultSchematicLengthUnit preserves existing numeric and string positions", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <resistor name="R1" resistance="1k" schX={2.2} schY="-1.1mm" />
    </board>,
  )
  circuit.render()
  expect(circuit.db.schematic_component.list()[0].center).toEqual({
    x: 2.2,
    y: -1.1,
  })
})
