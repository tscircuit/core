import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { computeDistanceBetweenBoxes, type Box } from "@tscircuit/math-utils"
import type { SchematicComponent } from "circuit-json"

test("nested-groups-autolayout-issue", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <group>
        <resistor name="R2" resistance="2.2k" />
      </group>
      <group>
        <resistor name="R3" resistance="10k" />
      </group>
      <trace from=".R2 > .pin2" to=".R3 > .pin1" />
    </board>,
  )

  circuit.render()

  const [comp1, comp2] = circuit.db.schematic_component.list()

  const makeBox = (comp: SchematicComponent): Box => {
    return {
      center: comp.center,
      width: comp.size.width,
      height: comp.size.height,
    }
  }

  const { distance } = computeDistanceBetweenBoxes(
    makeBox(comp1),
    makeBox(comp2),
  )

  expect(distance).toBeGreaterThan(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
