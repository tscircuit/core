import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const boardWithUnbrokenPour = (autorouter: {
  serverUrl: string
  serverMode: "solve-endpoint" | "job"
  inputFormat?: "circuit-json" | "simplified"
}) => (
  <board width="20mm" height="10mm" layers={4} autorouter={autorouter}>
    <copperpour layer="inner1" connectsTo="net.GND" unbroken />
    <copperpour layer="inner2" connectsTo="net.VCC" />
    <chip
      footprint="soic10"
      name="U1"
      pcbX={5}
      pcbY={0}
      connections={{
        pin2: "net.GND",
        pin3: "net.VCC",
      }}
    />
    <resistor
      name="R1"
      pcbX={-5}
      pcbY={0}
      resistance={100}
      footprint="0402"
      connections={{ pin1: "net.GND" }}
    />
    <trace from=".U1 > .pin1" to=".R1 > .pin2" />
  </board>
)

const expectUnbrokenGndPourOnInner1 = (simpleRouteJson: SimpleRouteJson) => {
  const copperPourObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) => obstacle.isCopperPour,
  )
  const obstacleLayers = new Set(
    copperPourObstacles.flatMap((obstacle) => obstacle.layers),
  )

  expect(copperPourObstacles.length).toBeGreaterThan(0)
  expect(obstacleLayers.has("inner1")).toBe(true)
  expect(obstacleLayers.has("inner2")).toBe(false)
}

const expectRawCircuitJsonLosesPourIntent = (circuitJson: unknown[]) => {
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJson as never,
  })
  expect(
    simpleRouteJson.obstacles.some((obstacle) => obstacle.isCopperPour),
  ).toBe(false)
}

test("legacy solve endpoint sends unbroken-pour SRJ even without inputFormat=simplified", async () => {
  const { autoroutingServerUrl, capturedSolveBodies } =
    getTestAutoroutingServer()
  const { circuit } = getTestFixture()

  circuit.add(
    boardWithUnbrokenPour({
      serverUrl: autoroutingServerUrl,
      serverMode: "solve-endpoint",
    }),
  )

  await circuit.renderUntilSettled()

  expect(capturedSolveBodies).toHaveLength(1)
  const body = capturedSolveBodies[0]
  expect(body.input_simple_route_json).toBeDefined()
  expect(body.input_circuit_json).toBeDefined()
  expectUnbrokenGndPourOnInner1(body.input_simple_route_json)
  expectRawCircuitJsonLosesPourIntent(body.input_circuit_json)
})

test("autorouting job mode sends unbroken-pour SRJ alongside raw Circuit JSON", async () => {
  const { autoroutingServerUrl, capturedCreateBodies } =
    getTestAutoroutingServer({
      requireDisplayName: true,
    })
  const { circuit } = getTestFixture()
  circuit.name = "unbroken-pour-job"

  circuit.add(
    boardWithUnbrokenPour({
      serverUrl: autoroutingServerUrl,
      serverMode: "job",
    }),
  )

  await circuit.renderUntilSettled()

  expect(capturedCreateBodies).toHaveLength(1)
  const body = capturedCreateBodies[0]
  expect(body.input_simple_route_json).toBeDefined()
  expect(body.input_circuit_json).toBeDefined()
  expectUnbrokenGndPourOnInner1(body.input_simple_route_json)
  expectRawCircuitJsonLosesPourIntent(body.input_circuit_json)
})
