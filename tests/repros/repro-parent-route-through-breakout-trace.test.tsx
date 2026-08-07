import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parent route connects through a pre-routed breakout trace", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="16mm" height="10mm">
      <subcircuit name="S1" autorouter="auto">
        <breakout name="B1" autorouter="auto" width="8mm" height="8mm">
          <net name="GND" />
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-1} />
          <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={1} />
          <trace from=".R1 > .pin2" to="net.GND" />
          <trace from=".C1 > .pin2" to="net.GND" />
          <breakoutpoint connection=".R1 > .pin1" pcbX={-3.9999} pcbY={0} />
        </breakout>
      </subcircuit>

      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-6} />
      <trace from=".R2 > .pin1" to=".S1 .R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutPointId =
    circuit.db.pcb_breakout_point.list()[0]?.pcb_breakout_point_id
  const [breakoutPhase, parentPhase] = autoroutingPhaseIoStack

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(breakoutPointId).toBeDefined()
  expect(
    breakoutPhase?.startSimpleRouteJson?.connections.some((connection) =>
      connection.pointsToConnect.some(
        (point) => point.pointId === breakoutPointId,
      ),
    ),
  ).toBe(true)
  expect(
    parentPhase?.startSimpleRouteJson?.connections[0]?.pointsToConnect.some(
      (point) => point.pointId === breakoutPointId,
    ),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
