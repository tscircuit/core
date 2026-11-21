import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an inch board accepts explicit millimeters and a subcircuit can switch to millimeters", () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board defaultSchematicLengthUnit="in">
      <resistor name="R1" resistance="1k" schX="0.4" schY="-10.16mm" />
      <group subcircuit defaultSchematicLengthUnit="mm">
        <resistor name="R2" resistance="1k" schX={-10.16} schY="0.4in" />
      </group>
    </board>,
  )
  circuit.render()
  const centers = circuit.db.schematic_component
    .list()
    .map((component) => component.center)
    .sort((a, b) => a.x - b.x)
  expect(centers).toHaveLength(2)
  expect(centers[0].x).toBeCloseTo(-1.1, 10)
  expect(centers[0].y).toBeCloseTo(1.1, 10)
  expect(centers[1].x).toBeCloseTo(1.1, 10)
  expect(centers[1].y).toBeCloseTo(-1.1, 10)
})
