import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parent net routing uses the child breakout point", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="18mm" height="10mm">
      <net name="VCC" />
      <subcircuit name="S1">
        <breakout name="B1">
          <net name="VCC" />
          <chip name="U1" footprint="soic8" pcbX={-1} />
          <breakoutpoint connection=".U1 > .pin1" pcbX={3.9999} pcbY={1.905} />
          <trace name="INTERNAL_VCC" from=".U1 > .pin1" to="net.VCC" />
        </breakout>
      </subcircuit>

      <resistor name="R1" resistance="1k" footprint="0402" pcbX={7} />
      <trace name="CHILD_VCC" from=".S1 .U1 > .pin1" to="net.VCC" />
      <trace name="LOAD_VCC" from=".R1 > .pin1" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "default-breakout-one-point-net-autorouting-srj",
    circuit,
  )
  const onePointConnections = autoroutingPhaseIoStack.flatMap((phase) =>
    (phase.startSimpleRouteJson?.connections ?? []).filter(
      (connection) => connection.pointsToConnect.length < 2,
    ),
  )

  const breakoutPoint = circuit.db.pcb_breakout_point.list()[0]
  const innerPcbPort = circuit.db.pcb_port.getWhere({
    source_port_id: breakoutPoint.source_port_id!,
  })
  const parentResistor = circuit.db.source_component.getWhere({ name: "R1" })
  const parentSourcePort = circuit.db.source_port
    .list()
    .find(
      (sourcePort) =>
        sourcePort.source_component_id ===
          parentResistor?.source_component_id && sourcePort.name === "pin1",
    )
  const parentPcbPort = circuit.db.pcb_port.getWhere({
    source_port_id: parentSourcePort!.source_port_id,
  })
  const parentNetConnection = autoroutingPhaseIoStack
    .flatMap((phase) => phase.startSimpleRouteJson?.connections ?? [])
    .find((connection) =>
      connection.pointsToConnect.some(
        (point) => point.pcb_port_id === parentPcbPort?.pcb_port_id,
      ),
    )

  expect(parentNetConnection).toBeDefined()
  expect(parentNetConnection!.pointsToConnect).toContainEqual(
    expect.objectContaining({ pointId: breakoutPoint.pcb_breakout_point_id }),
  )
  expect(parentNetConnection!.pointsToConnect).not.toContainEqual(
    expect.objectContaining({ pcb_port_id: innerPcbPort?.pcb_port_id }),
  )
  expect(onePointConnections).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
})
