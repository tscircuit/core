import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("parent net should route to a child breakout point", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="18mm" height="10mm">
      <net name="VCC" />
      <subcircuit name="S1">
        <breakout name="B1">
          <net name="VCC" />
          <chip name="U1" footprint="soic8" pcbX={-1} />
          <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={-5} />
          <breakoutpoint connection=".U1 > .pin1" pcbX={3.9999} pcbY={1.905} />
          <trace name="INTERNAL_VCC" from=".U1 > .pin1" to="net.VCC" />
          <trace from=".C1 > .pin1" to="net.VCC" />
        </breakout>
      </subcircuit>

      <resistor name="R1" resistance="1k" footprint="0402" pcbX={7} />
      <trace name="CHILD_VCC" from=".S1 .U1 > .pin1" to="net.VCC" />
      <trace name="LOAD_VCC" from=".R1 > .pin1" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack.length).toBeGreaterThan(1)

  const breakoutPoint = circuit.db.pcb_breakout_point.list()[0]!
  const internalPort = circuit.db.pcb_port.getWhere({
    source_port_id: breakoutPoint.source_port_id!,
  })!
  const parentVccConnection = autoroutingPhaseIoStack
    .at(-1)!
    .startSimpleRouteJson!.connections.find((connection) =>
      connection.pointsToConnect.some(
        (point) =>
          point.pointId === breakoutPoint.pcb_breakout_point_id ||
          point.pointId === internalPort.pcb_port_id,
      ),
    )

  expect(parentVccConnection).toBeDefined()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(
    parentVccConnection!.pointsToConnect.some(
      (point) => point.pointId === breakoutPoint.pcb_breakout_point_id,
    ),
  ).toBe(true)
  expect(
    parentVccConnection!.pointsToConnect.some(
      (point) => point.pointId === internalPort.pcb_port_id,
    ),
  ).toBe(false)
})
