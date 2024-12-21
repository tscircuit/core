import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Non-subcircuit group offset schematic", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board width={10} height={10}>
      <group name="group1" schX={5}>
        <resistor name="R1" footprint="0402" resistance={1000} />
        <capacitor name="C1" footprint="0402" capacitance={1000} schX={3} />
        <trace path={[".R1 > .pin2", ".C1 > .pin1"]} />
      </group>
    </board>,
  )

  circuit.render()

  const schComponent = su(circuit.getCircuitJson()).schematic_component.list()

  const resistor = schComponent.find(
    (c) => c.schematic_component_id === "schematic_component_0",
  )
  const capacitor = schComponent.find(
    (c) => c.schematic_component_id === "schematic_component_1",
  )

  expect(resistor?.center.x).toBe(5)
  expect(resistor?.center.y).toBe(0)
  expect(capacitor?.center.x).toBe(8)
  expect(capacitor?.center.y).toBe(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
