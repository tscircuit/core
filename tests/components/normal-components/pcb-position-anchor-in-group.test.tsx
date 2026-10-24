import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("component pcbPositionAnchor preserves parent group offsets for nine-point and pin anchors", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <group name="G1" pcbX={10} pcbY={12} subcircuit>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={3}
          pcbPositionAnchor="pin1"
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={-2}
          pcbPositionAnchor="top_left"
        />
        <group name="G2" pcbX={2} pcbY={4} subcircuit>
          <resistor
            name="R3"
            resistance="1k"
            footprint="0402"
            pcbX={3}
            pcbY={1}
            pcbPositionAnchor="center"
          />
        </group>
      </group>
    </board>,
  )

  circuit.render()

  const r1 = circuit.selectOne(".G1 > .R1") as any
  const r1Pin1Pos = r1.portMap.pin1._getGlobalPcbPositionAfterLayout()
  expect(r1Pin1Pos.x).toBeCloseTo(15)
  expect(r1Pin1Pos.y).toBeCloseTo(15)

  const r2 = circuit.selectOne(".G1 > .R2")!
  const r2Bounds = r2._getPcbCircuitJsonBounds().bounds
  expect(r2Bounds.left).toBeCloseTo(6)
  expect(r2Bounds.top).toBeCloseTo(10)

  const r3Pcb = circuit.db.pcb_component.list()[2]!
  expect(r3Pcb.center.x).toBeCloseTo(15)
  expect(r3Pcb.center.y).toBeCloseTo(17)
})
