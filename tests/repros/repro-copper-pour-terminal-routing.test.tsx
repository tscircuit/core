import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver } from "@tscircuit/capacity-autorouter"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getCopperPourRoutingSnapshot } from "tests/fixtures/get-copper-pour-routing-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SRJ requests a route between terminals already joined by copper", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" routingDisabled>
      <net name="GND" />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={-4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        pcbX={4}
        connections={{ pin1: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const gndNet = circuit.db.source_net.list().find((net) => net.name === "GND")
  if (!gndNet) throw new Error("Expected the GND source net")

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const gndConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === gndNet.source_net_id,
  )
  if (!gndConnection) {
    throw new Error("Expected the GND SRJ connection")
  }
  if (gndConnection.pointsToConnect.length !== 2) {
    throw new Error("Expected exactly two GND terminals")
  }

  const [firstPoint, secondPoint] = gndConnection.pointsToConnect
  if (!firstPoint?.pointId || !secondPoint?.pointId) {
    throw new Error("Expected both GND terminals to have point IDs")
  }

  expect(gndConnection.externallyConnectedPointIds).toBeUndefined()

  expect(simpleRouteJson.traces ?? []).toHaveLength(0)
  const router = new AutoroutingPipelineSolver({
    ...simpleRouteJson,
    traces: [],
  })
  while (!router.srjWithPointPairs && !router.failed && !router.solved) {
    router.step()
  }
  expect(router.failed).toBe(false)
  const requestedRoutes = router.srjWithPointPairs!.connections
  expect(requestedRoutes).toHaveLength(1)

  await expect(
    getCopperPourRoutingSnapshot({
      circuitJson,
      gndConnection,
      requestedRoutes,
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
