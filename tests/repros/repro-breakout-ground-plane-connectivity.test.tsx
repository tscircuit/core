import { expect, test } from "bun:test"
import {
  AutoroutingPipelineSolver,
  type SimpleRouteJson as AutorouterSimpleRouteJson,
} from "@tscircuit/capacity-autorouter"
import {
  copperPolygonsTouch,
  getPourPolygon,
  getViaPolygon,
} from "@tscircuit/circuit-json-util"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getBreakoutGroundPlaneSnapshot } from "tests/fixtures/get-breakout-ground-plane-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  Stm32mp157dab1,
  stm32GroundConnections,
} from "tests/fixtures/stm32mp157dab1"

test("breakout vias lose their existing ground-plane connection in SRJ", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={24}
      height={24}
      pcbY={20}
      layers={6}
      routeRemaining={false}
      minTraceWidth={0.15}
      minTraceToPadEdgeClearance={0.125}
      minPadEdgeToPadEdgeClearance={0.15}
      isViaInPadAllowed
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
      schematicDisabled
    >
      <net name="GND" isGroundNet />
      <breakout
        name="MPU_ESCAPE"
        pcbX={0}
        pcbY={0}
        width={20}
        height={20}
        autorouter="dogbone"
        fanoutPourNetMap={{}}
        fanoutRoutingLayers={["top", "inner3"]}
      >
        <Stm32mp157dab1
          name="U70"
          pcbX={0}
          pcbY={0}
          connections={stm32GroundConnections}
        />
      </breakout>
      <copperpour
        connectsTo="net.GND"
        layer="inner1"
        unbroken
        clearance={0.2}
        boardEdgeMargin={0.5}
        useThermalReliefs={false}
      />
    </board>,
  )
  // Native dogbone creates the traces/vias; the native pour solver fills inner1.
  // The following native point-pair stage exposes any redundant global request.
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(354)
  expect(circuit.db.pcb_via.list()).toHaveLength(104)
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(1)

  const groundPlane = getPourPolygon(circuit.db.pcb_copper_pour.list()[0]!)
  // Check actual annular copper on inner1, not just shared net names.
  expect(
    circuit.db.pcb_via
      .list()
      .every(
        (via) =>
          via.layers.includes("inner1") &&
          copperPolygonsTouch(
            groundPlane,
            getViaPolygon(via, via.outer_diameter, via.hole_diameter),
          ),
      ),
  ).toBe(true)

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
  expect(gndConnection.pointsToConnect).toHaveLength(104)
  expect(gndConnection.pointsToConnect.map((point) => point.pointId)).toEqual(
    circuit.db.pcb_breakout_point
      .list()
      .map((point) => point.pcb_breakout_point_id),
  )

  const router = new AutoroutingPipelineSolver(
    simpleRouteJson as AutorouterSimpleRouteJson,
  )
  while (!router.srjWithPointPairs && !router.failed && !router.solved) {
    router.step()
  }
  expect(router.failed).toBe(false)
  const requestedRoutes = router.srjWithPointPairs!.connections
  // Reproduction: all 104 GND escapes touch one plane, yet core requests
  // 103 extra links. This is the chip's complete motherboard ground network.
  expect(requestedRoutes).toHaveLength(103)
  await expect(
    getBreakoutGroundPlaneSnapshot({
      circuitJson,
      gndConnection,
      requestedRoutes,
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
