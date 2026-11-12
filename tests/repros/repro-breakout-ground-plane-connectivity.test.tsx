import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver } from "@tscircuit/capacity-autorouter"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getCopperPourRoutingSnapshot } from "tests/fixtures/get-copper-pour-routing-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const GroundChip = ({ name, pcbX }: { name: string; pcbX: number }) => (
  <breakout
    name={`${name}_ESCAPE`}
    pcbX={pcbX}
    pcbY={0}
    width={4}
    height={4}
    autorouter="dogbone"
    fanoutPourNetMap={{}}
    fanoutRoutingLayers={["inner2"]}
  >
    <chip
      name={name}
      pcbX={0}
      pinLabels={{ pin1: "GND" }}
      connections={{ pin1: "net.GND" }}
      footprint={
        <footprint>
          <smtpad
            portHints={["1"]}
            pcbX={0}
            pcbY={0}
            shape="circle"
            radius={0.25}
          />
          <smtpad
            portHints={["2"]}
            pcbX={1}
            pcbY={0}
            shape="circle"
            radius={0.25}
          />
          <smtpad
            portHints={["3"]}
            pcbX={0}
            pcbY={1}
            shape="circle"
            radius={0.25}
          />
          <smtpad
            portHints={["4"]}
            pcbX={1}
            pcbY={1}
            shape="circle"
            radius={0.25}
          />
        </footprint>
      }
    />
  </breakout>
)

test("breakout vias lose their existing ground-plane connection in SRJ", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={12}
      layers={4}
      routeRemaining={false}
      minTraceWidth={0.1}
      minViaPadDiameter={0.4}
      minViaHoleDiameter={0.15}
      schematicDisabled
    >
      <net name="GND" isGroundNet />
      <GroundChip name="U1" pcbX={-4} />
      <GroundChip name="U2" pcbX={4} />
      <copperpour
        connectsTo="net.GND"
        layer="inner1"
        unbroken
        useThermalReliefs={false}
      />
    </board>,
  )
  // Native dogbone creates the traces/vias; the native pour solver fills inner1.
  // The following native point-pair stage exposes any redundant global request.
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_via.list()).toHaveLength(2)
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(1)

  const circuitJson = circuit.getCircuitJson()
  const gndNet = circuit.db.source_net.getWhere({ name: "GND" })!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    subcircuit_id: gndNet.subcircuit_id,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const gndConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === gndNet.source_net_id,
  )!
  expect(gndConnection.pointsToConnect).toHaveLength(2)
  expect(gndConnection.pointsToConnect.map((point) => point.pointId)).toEqual(
    circuit.db.pcb_breakout_point
      .list()
      .map((point) => point.pcb_breakout_point_id),
  )

  const router = new AutoroutingPipelineSolver(simpleRouteJson)
  while (!router.srjWithPointPairs && !router.failed && !router.solved) {
    router.step()
  }
  expect(router.failed).toBe(false)
  const requestedRoutes = router.srjWithPointPairs!.connections
  // Reproduction: both vias already touch GND, but a global route is requested.
  expect(requestedRoutes).toHaveLength(1)
  await expect(
    getCopperPourRoutingSnapshot({
      circuitJson,
      gndConnection,
      requestedRoutes,
      layer: "inner1",
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
