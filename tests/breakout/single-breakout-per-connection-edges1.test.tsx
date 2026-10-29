import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getExitEdge = (
  point: { x: number; y: number },
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
) => {
  const distances = {
    left: Math.abs(point.x - bounds.minX),
    right: Math.abs(point.x - bounds.maxX),
    bottom: Math.abs(point.y - bounds.minY),
    top: Math.abs(point.y - bounds.maxY),
  }
  return Object.entries(distances).sort((a, b) => a[1] - b[1])[0]![0]
}

test("single breakout sends each connection out of the edge facing its destination", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm" routeRemaining={false}>
      <breakout name="B1" padding="1.5mm">
        <chip name="U1" footprint="bga16_grid4x4_p1mm" />
      </breakout>
      <resistor
        name="RL1"
        resistance="1k"
        footprint="0402"
        pcbX={-14}
        pcbY={1}
      />
      <resistor
        name="RL2"
        resistance="1k"
        footprint="0402"
        pcbX={-14}
        pcbY={-1}
      />
      <resistor
        name="RR1"
        resistance="1k"
        footprint="0402"
        pcbX={14}
        pcbY={1}
      />
      <resistor
        name="RR2"
        resistance="1k"
        footprint="0402"
        pcbX={14}
        pcbY={-1}
      />
      <resistor
        name="RB1"
        resistance="1k"
        footprint="0402"
        pcbX={-1}
        pcbY={-11}
      />
      <resistor
        name="RB2"
        resistance="1k"
        footprint="0402"
        pcbX={1}
        pcbY={-11}
      />
      <resistor
        name="RB3"
        resistance="1k"
        footprint="0402"
        pcbX={3}
        pcbY={-11}
      />
      {/* Row A is the bottom row (-Y) of this footprint */}
      <trace name="SIG_L1" from="U1.pin5" to="RL1.pin2" />
      <trace name="SIG_L2" from="U1.pin9" to="RL2.pin2" />
      <trace name="SIG_R1" from="U1.pin8" to="RR1.pin1" />
      <trace name="SIG_R2" from="U1.pin12" to="RR2.pin1" />
      <trace name="SIG_B1" from="U1.pin2" to="RB1.pin1" />
      <trace name="SIG_B2" from="U1.pin3" to="RB2.pin1" />
      <trace name="SIG_B3" from="U1.pin6" to="RB3.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutGroup = circuit.db.pcb_group
    .list()
    .find((group) => group.name === "B1")!
  const bounds = {
    minX: breakoutGroup.center.x - breakoutGroup.width! / 2,
    maxX: breakoutGroup.center.x + breakoutGroup.width! / 2,
    minY: breakoutGroup.center.y - breakoutGroup.height! / 2,
    maxY: breakoutGroup.center.y + breakoutGroup.height! / 2,
  }
  const edgeByTraceName = Object.fromEntries(
    circuit.db.pcb_breakout_point.list().map((point) => {
      const sourceTrace = circuit.db.source_trace.get(point.source_trace_id!)!
      return [sourceTrace.name, getExitEdge(point, bounds)]
    }),
  )

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(edgeByTraceName).toEqual({
    SIG_L1: "left",
    SIG_L2: "left",
    SIG_R1: "right",
    SIG_R2: "right",
    SIG_B1: "bottom",
    SIG_B2: "bottom",
    SIG_B3: "bottom",
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
