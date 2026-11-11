import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("preserves net-attached differential paths and their separate tap", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={19} height={11} routingDisabled schematicDisabled>
      <pinheader name="A" pinCount={2} pcbX={-6} pcbRotation={90} />
      <pinheader name="B" pinCount={2} pcbRotation={90} />
      <pinheader name="C" pinCount={2} pcbX={6} pcbRotation={90} />
      <pinheader name="TP" pinCount={1} pcbY={3.5} />
      <net name="DATA_P" />
      <net name="DATA_N" />
      <trace name="D_P" path={["A.pin1", "B.pin1", "C.pin1", "net.DATA_P"]} />
      <trace name="D_N" path={["A.pin2", "B.pin2", "C.pin2", "net.DATA_N"]} />
      <trace from="net.DATA_P" to="TP.pin1" />
      <differentialpair positiveConnection="D_P" negativeConnection="D_N" />
    </board>,
  )
  circuit.render()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })
  const positiveNet = circuit.db.source_net.getWhere({ name: "DATA_P" })!
  const negativeNet = circuit.db.source_net.getWhere({ name: "DATA_N" })!

  expect(simpleRouteJson.connections).toHaveLength(3)
  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: ["source_trace_0", "source_trace_1"],
      lengthTolerance: 0.1,
    },
  ])
  expect(
    simpleRouteJson.connections
      .filter((connection) => connection.path)
      .map(({ name, path, netConnectionName }) => ({
        name,
        path,
        netConnectionName,
      })),
  ).toEqual([
    {
      name: "source_trace_0",
      path: ["pcb_port_0", "pcb_port_2", "pcb_port_4"],
      netConnectionName: positiveNet.source_net_id,
    },
    {
      name: "source_trace_1",
      path: ["pcb_port_1", "pcb_port_3", "pcb_port_5"],
      netConnectionName: negativeNet.source_net_id,
    },
  ])
  const tapConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === positiveNet.source_net_id,
  )
  expect(tapConnection?.pointsToConnect.map((point) => point.pointId)).toEqual([
    "pcb_port_0",
    "pcb_port_6",
  ])
})
