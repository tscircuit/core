import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Pt4115LedDriver from "./fixtures/pt4115-led-driver/index.circuit"

test("explicit trace thickness is preserved on a shared power net (#5526)", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Pt4115LedDriver />)
  await circuit.renderUntilSettled()

  const r2 = circuit.db.source_component.getWhere({ name: "R2" })!
  const r2Pin2SourcePort = circuit.db.source_port.getWhere({
    source_component_id: r2.source_component_id,
    name: "pin2",
  })!
  const r2Pin2PcbPort = circuit.db.pcb_port.getWhere({
    source_port_id: r2Pin2SourcePort.source_port_id,
  })!

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  const r2Pin2Connections = simpleRouteJson.connections.filter((connection) =>
    connection.pointsToConnect.some(
      (point) => point.pcb_port_id === r2Pin2PcbPort.pcb_port_id,
    ),
  )

  expect(r2Pin2Connections.map((connection) => connection.width)).toEqual([
    0.25,
  ])

  const vinNet = circuit.db.source_net.getWhere({ name: "VIN_24V" })!
  const vinNetConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === vinNet.source_net_id,
  )!
  expect(vinNetConnection.width).toBe(0.85)
})
