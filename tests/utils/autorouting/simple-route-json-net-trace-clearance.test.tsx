import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SRJ resolves clearance aliases without changing copper geometry or board minima", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={24}
      height={15}
      routingDisabled
      schematicDisabled
      minTraceWidth={0.2}
      minTraceToPadEdgeClearance={0.1}
    >
      <net name="USB" minTraceClearance="0.15mm" />
      <net name="ALIAS" minTraceClearance="0.22mm" />
      <net name="ZERO" minTraceClearance={0} />
      <net name="DEFAULT" />
      <pinheader name="J1" pinCount={3} pcbX={-8} />
      <pinheader name="J2" pinCount={3} />
      <pinheader name="J3" pinCount={3} pcbX={8} />
      <trace from="net.USB" to="net.ALIAS" />
      <trace path={["J1.pin1", "J2.pin1", "J3.pin1", "net.USB"]} />
      <trace from="J1.pin2" to="net.ZERO" />
      <trace from="J3.pin2" to="net.ZERO" />
      <trace from="J1.pin3" to="net.DEFAULT" />
      <trace from="J3.pin3" to="net.DEFAULT" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const originalJson = structuredClone(circuitJson)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    subcircuitComponent: circuit.firstChild!,
  })
  const usbNet = circuit.db.source_net.getWhere({ name: "USB" })!
  const zeroNet = circuit.db.source_net.getWhere({ name: "ZERO" })!
  const defaultNet = circuit.db.source_net.getWhere({ name: "DEFAULT" })!
  const usbPath = simpleRouteJson.connections.find(
    (connection) => connection.path,
  )
  expect(usbPath).toMatchObject({
    netConnectionName: usbNet.source_net_id,
    minTraceClearance: 0.22,
    nominalTraceWidth: 0.2,
  })
  expect(
    simpleRouteJson.connections.find(
      (connection) => connection.name === zeroNet.source_net_id,
    ),
  ).toHaveProperty("minTraceClearance", 0)
  expect(
    simpleRouteJson.connections.find(
      (connection) => connection.name === defaultNet.source_net_id,
    ),
  ).not.toHaveProperty("minTraceClearance")
  const usbPads = simpleRouteJson.obstacles.filter((obstacle) =>
    obstacle.connectedTo.includes(usbNet.source_net_id),
  )
  expect(usbPads).toHaveLength(3)
  expect(usbPads.map((obstacle) => obstacle.minTraceClearance)).toEqual([
    0.22, 0.22, 0.22,
  ])
  expect(simpleRouteJson.minTraceToPadEdgeClearance).toBe(0.1)
  expect(simpleRouteJson.minTraceWidth).toBe(0.2)

  const jsonWithoutRules = structuredClone(circuitJson)
  for (const sourceNet of jsonWithoutRules) {
    if (sourceNet.type === "source_net") delete sourceNet.min_trace_clearance
  }
  const { simpleRouteJson: withoutRules } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: jsonWithoutRules,
    subcircuitComponent: circuit.firstChild!,
  })
  expect(
    simpleRouteJson.obstacles.map(
      ({ minTraceClearance, ...obstacle }) => obstacle,
    ),
  ).toEqual(withoutRules.obstacles)
  expect(
    simpleRouteJson.connections.map(
      ({ minTraceClearance, ...connection }) => connection,
    ),
  ).toEqual(withoutRules.connections)
  expect(circuitJson).toEqual(originalJson)
})
