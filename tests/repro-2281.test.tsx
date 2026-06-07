import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

test("manual placement in positioned group does not double-count parent transform", () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board
      width="40mm"
      height="40mm"
      manualEdits={{
        pcb_placements: [
          {
            selector: ".R1",
            center: { x: 5, y: 5 },
          },
        ],
      }}
    >
      <group pcbX={10} pcbY={10}>
        <resistor name="R1" resistance="10k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  const resistor = circuit.selectOne(".R1")
  expect(resistor).not.toBeNull()

  const resistorPosition = resistor!._getGlobalPcbPositionBeforeLayout()
  expect(resistorPosition.x).toBeCloseTo(5, 1)
  expect(resistorPosition.y).toBeCloseTo(5, 1)
})

test("manual placement in rotated group inherits parent group's rotation", () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board
      width="40mm"
      height="40mm"
      manualEdits={{
        pcb_placements: [
          {
            selector: ".R1",
            center: { x: 5, y: 5 },
          },
        ],
      }}
    >
      <group pcbX={10} pcbY={10} pcbRotation={90}>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbRotation={45}
        />
      </group>
    </board>,
  )

  circuit.render()

  const resistor = circuit.selectOne(".R1")
  expect(resistor).not.toBeNull()

  const resistorPosition = resistor!._getGlobalPcbPositionBeforeLayout()
  expect(resistorPosition.x).toBeCloseTo(5, 1)
  expect(resistorPosition.y).toBeCloseTo(5, 1)

  const globalRotation = (resistor as any).getGlobalTransformRotation()
  expect(globalRotation).toBeCloseTo(135, 1)
})
