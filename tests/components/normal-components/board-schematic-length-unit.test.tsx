import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("millimeter placement composes group and component offsets in sheet units", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board defaultSchematicLengthUnit="mm">
      <group schX="0.4in">
        <resistor
          name="R1"
          resistance="1k"
          schX={10.16}
          schY="-10.16mm"
          pcbX={10.16}
        />
      </group>
    </board>,
  )
  circuit.render()
  const [resistor] = circuit.db.schematic_component.list()
  expect(resistor.center.x).toBeCloseTo(2.2, 10)
  expect(resistor.center.y).toBeCloseTo(-1.1, 10)
  expect(circuit.db.pcb_component.list()[0].center.x).toBeCloseTo(10.16, 10)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
