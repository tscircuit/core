import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parent autorouting net connections exclude private child subcircuit nets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <net name="VCC" />
      <net name="GND" />

      <subcircuit name="PICO">
        <net name="VCC" />
        <net name="GND" />
        <net name="PRIVATE" />
        <resistor
          name="R_CHILD"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={0}
        />
        <capacitor
          name="C_CHILD"
          capacitance="100nF"
          footprint="0402"
          pcbX={-2}
          pcbY={0}
        />
        <resistor
          name="R_PRIVATE"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          pcbY={2}
        />
        <trace name="CHILD_R_VCC" from=".R_CHILD > .pin1" to="net.VCC" />
        <trace name="CHILD_R_GND" from=".R_CHILD > .pin2" to="net.GND" />
        <trace name="CHILD_C_VCC" from=".C_CHILD > .pin1" to="net.VCC" />
        <trace name="CHILD_C_GND" from=".C_CHILD > .pin2" to="net.GND" />
        <trace
          name="CHILD_PRIVATE_A"
          from=".R_PRIVATE > .pin1"
          to="net.PRIVATE"
        />
        <trace
          name="CHILD_PRIVATE_B"
          from=".R_PRIVATE > .pin2"
          to="net.PRIVATE"
        />
      </subcircuit>

      <resistor
        name="R_PARENT"
        resistance="1k"
        footprint="0402"
        pcbX={4}
        pcbY={0}
      />
      <trace name="PARENT_VCC" from=".R_PARENT > .pin1" to="net.VCC" />
      <trace name="PARENT_GND" from=".R_PARENT > .pin2" to="net.GND" />
      <trace name="PICO_VCC" from="net.VCC" to=".PICO net.VCC" />
      <trace name="PICO_GND" from="net.GND" to=".PICO net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(0)

  const sourceBoard = circuit.db.source_board.list()[0]
  const boardSubcircuitId = `subcircuit_${sourceBoard.source_group_id}`
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    subcircuit_id: boardSubcircuitId,
  })

  const connectionComponentNames = simpleRouteJson.connections.flatMap((conn) =>
    conn.pointsToConnect
      .map((point) => {
        if (!point.pcb_port_id) return null
        const pcbPort = circuit.db.pcb_port.get(point.pcb_port_id)
        if (!pcbPort?.source_port_id) return null
        const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id)
        if (!sourcePort?.source_component_id) return null
        return circuit.db.source_component.get(sourcePort.source_component_id)
          ?.name
      })
      .filter((name): name is string => Boolean(name)),
  )

  expect(connectionComponentNames).toContain("R_PARENT")
  expect(connectionComponentNames).not.toContain("R_CHILD")
  expect(connectionComponentNames).not.toContain("C_CHILD")
  expect(connectionComponentNames).not.toContain("R_PRIVATE")
})
