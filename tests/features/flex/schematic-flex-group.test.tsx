import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic-flex of group when dimension of board is not present", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board schFlex routingDisabled>
      <group>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
      <group>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
