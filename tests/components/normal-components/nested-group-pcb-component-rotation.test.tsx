import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb component rotation includes nested group rotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <group pcbRotation={90}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          pcbRotation={45}
        />
        <chip name="U1" footprint="soic8" pcbX={3} pcbRotation={-45} />
      </group>
      <pcbnotetext
        text="PCB rotations include the 90 degree parent rotation"
        pcbY={5}
      />
    </board>,
  )

  circuit.render()

  const sourceComponentNameById = new Map(
    circuit.db.source_component
      .list()
      .map((component) => [component.source_component_id, component.name]),
  )
  const rotationByName = Object.fromEntries(
    circuit.db.pcb_component
      .list()
      .map((component) => [
        sourceComponentNameById.get(component.source_component_id),
        component.rotation,
      ]),
  )

  expect(rotationByName).toEqual({ R1: 135, U1: 45 })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
