import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor pin aliases", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group>
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="1206"
        connections={{ pos: "R1.1" }}
      />
      <resistor name="R1" resistance="1k" footprint="1206" />
    </group>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
