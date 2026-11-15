import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("direct trace thickness does not widen its net", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-10}
        pcbY={5}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={10} pcbY={5} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        pcbX={-10}
        pcbY={-5}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0603"
        pcbX={10}
        pcbY={-5}
      />
      <net name="VBUS" />
      <trace name="R1-R2" from="R1.pin2" to="R2.pin1" thickness="0.8mm" />
      <trace from="R3.pin2" to="net.VBUS" />
      <trace from="R4.pin1" to="net.VBUS" />
      <trace from="R1.pin2" to="net.VBUS" />
    </board>,
  )
  circuit.render()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  const r1R2Trace = circuit.db.source_trace.getWhere({ name: "R1-R2" })!
  const r1R2Connection = simpleRouteJson.connections.find(
    (connection) => connection.name === r1R2Trace.source_trace_id,
  )!
  expect(r1R2Connection.width).toBe(0.8)

  const vbusNet = circuit.db.source_net.getWhere({ name: "VBUS" })!
  const vbusConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === vbusNet.source_net_id,
  )!
  expect(vbusConnection.width).toBe(0.1)
  expect(
    simpleRouteJson.connections.filter(
      (connection) => connection.width === 0.8,
    ),
  ).toHaveLength(1)
})
