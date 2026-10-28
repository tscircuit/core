import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("single breakout exits toward a part placed inside its bounds", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm" routeRemaining={false}>
      <breakout name="B1" padding="4mm">
        <chip name="U1" footprint="bga16_grid4x4_p1mm" />
      </breakout>
      {/* Inside B1's padded bounds but not part of the breakout, like a
          crystal tucked next to an SoC. */}
      <resistor
        name="RX"
        resistance="1k"
        footprint="0402"
        pcbX={4.5}
        pcbY={0.5}
        pcbRotation={90}
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
      <trace name="XTAL" from="U1.pin12" to="RX.pin1" />
      <trace name="SIG_B1" from="U1.pin2" to="RB1.pin1" />
      <trace name="SIG_B2" from="U1.pin3" to="RB2.pin1" />
      <trace name="SIG_B3" from="U1.pin6" to="RB3.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutGroup = circuit.db.pcb_group
    .list()
    .find((group) => group.name === "B1")!
  const maxX = breakoutGroup.center.x + breakoutGroup.width! / 2
  const xtalPoint = circuit.db.pcb_breakout_point
    .list()
    .find(
      (point) =>
        circuit.db.source_trace.get(point.source_trace_id!)!.name === "XTAL",
    )!

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(xtalPoint.x).toBeCloseTo(maxX, 2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
