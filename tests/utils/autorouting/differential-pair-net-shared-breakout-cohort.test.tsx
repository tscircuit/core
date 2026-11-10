import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pairs every terminal when a net has multiple escapes in one breakout cohort", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      <breakout name="B1" pcbX={-6} width={6} height={10}>
        <chip
          name="U1"
          pcbY={2}
          footprint={differentialPairPathPads()}
          connections={{ pin1: "net.P", pin2: "net.N" }}
        />
        <chip
          name="U2"
          pcbY={-2}
          footprint={differentialPairPathPads()}
          connections={{ pin1: "net.P", pin2: "net.N" }}
        />
        <breakoutpoint connection=".U1 > .pin1" pcbX={2.9} pcbY={2.5} />
        <breakoutpoint connection=".U2 > .pin1" pcbX={2.9} pcbY={-1.5} />
        <breakoutpoint connection=".U2 > .pin2" pcbX={2.9} pcbY={-2.5} />
        <breakoutpoint connection=".U1 > .pin2" pcbX={2.9} pcbY={1.5} />
      </breakout>
      <chip
        name="U3"
        pcbX={6}
        footprint={differentialPairPathPads()}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="net.P"
        negativeConnection="net.N"
      />
    </board>,
  )
  circuit.render()
  const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: circuit.firstChild!.getSubcircuit().subcircuit_id,
    subcircuitComponent: circuit.firstChild!,
  })
  const pNet = circuit.db.source_net.getWhere({ name: "P" })!
  const nNet = circuit.db.source_net.getWhere({ name: "N" })!
  const escapeName = (component: string, pin: string) =>
    srj.connections.find(
      (connection) =>
        connection.routingPcbGroupId &&
        connection.pointsToConnect.some(
          (point) => point.port_selector === `${component}.${pin}`,
        ),
    )!.name
  expect(srj.differentialPairs).toEqual([
    {
      connectionNames: [pNet.source_net_id, nNet.source_net_id],
      lengthTolerance: 0.1,
    },
    {
      connectionNames: [escapeName("U1", "pin1"), escapeName("U1", "pin2")],
      lengthTolerance: 0.1,
    },
    {
      connectionNames: [escapeName("U2", "pin1"), escapeName("U2", "pin2")],
      lengthTolerance: 0.1,
    },
  ])
})
