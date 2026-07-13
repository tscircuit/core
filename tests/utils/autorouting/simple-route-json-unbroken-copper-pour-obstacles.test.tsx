import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple route json only includes unbroken copper pours as copper-pour obstacles", async (): Promise<void> => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" layers={4}>
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
      <copperpour layer="inner2" connectsTo="net.VCC" />
      <chip
        footprint="soic10"
        name="U1"
        connections={{
          pin2: "net.GND",
          pin3: "net.VCC",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const subcircuitComponent = circuit.firstChild
  if (!subcircuitComponent) {
    throw new Error("Expected the circuit to contain a board")
  }
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent,
  })

  const copperPourObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) => obstacle.isCopperPour,
  )
  const obstacleLayers = new Set(
    copperPourObstacles.flatMap((obstacle) => obstacle.layers),
  )
  const gndNet = circuit.db.source_net.list().find((net) => net.name === "GND")
  if (!gndNet) {
    throw new Error("Expected the GND source net")
  }
  const gndConnectivityMapKey: string | undefined =
    gndNet.subcircuit_connectivity_map_key
  if (!gndConnectivityMapKey) {
    throw new Error("Expected the GND subcircuit connectivity map key")
  }

  expect(copperPourObstacles.length).toBeGreaterThan(0)
  expect(obstacleLayers.has("inner1")).toBe(true)
  expect(obstacleLayers.has("inner2")).toBe(false)
  expect(gndNet?.source_net_id).toBeDefined()
  expect(
    copperPourObstacles.some((obstacle) =>
      obstacle.connectedTo.includes(gndNet.source_net_id),
    ),
  ).toBe(true)
  expect(
    copperPourObstacles.some((obstacle) =>
      obstacle.connectedTo.includes(gndConnectivityMapKey),
    ),
  ).toBe(true)
})
