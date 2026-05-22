import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { detectSchematicCollisions } from "lib/utils/schematic/detectSchematicCollisions"

test("schematic renders with no component body collisions after collision resolution", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" />
      <resistor name="R2" resistance="2k" />
      <resistor name="R3" resistance="3k" />
      <capacitor name="C1" capacitance="10uF" />
      <capacitor name="C2" capacitance="100nF" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const collisions = detectSchematicCollisions(circuitJson as any)

  const bodyCollisions = collisions.filter(
    (c) =>
      c.a.type === "schematic_component" && c.b.type === "schematic_component",
  )

  expect(bodyCollisions).toHaveLength(0)
})
