import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("remote job mode sends unbroken copper-pour obstacles before routing", async () => {
  const { autoroutingServerUrl, capturedJobCreateBodies } =
    getTestAutoroutingServer({
      requireDisplayName: true,
    })

  const { circuit } = getTestFixture()
  circuit.name = "unbroken-pour-job"

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={4}
      autorouter={{
        serverUrl: autoroutingServerUrl,
        serverMode: "job",
      }}
    >
      <pcbnotetext pcbX={0} pcbY={5} text="unbroken GND inner1" fontSize={1} />
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
      <copperpour layer="inner2" connectsTo="net.VCC" />
      <chip
        name="U1"
        footprint="soic8"
        pcbX={5}
        pcbY={0}
        connections={{ pin2: "net.GND", pin3: "net.VCC" }}
      />
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(capturedJobCreateBodies).toHaveLength(1)
  const jobCreateBody = capturedJobCreateBodies[0]
  const remoteSimpleRouteJson = jobCreateBody.input_simple_route_json
  const remoteCircuitJson = jobCreateBody.input_circuit_json

  const remoteCopperPourLayers = new Set(
    remoteSimpleRouteJson.obstacles
      .filter((obstacle: { isCopperPour?: boolean }) => obstacle.isCopperPour)
      .flatMap((obstacle: { layers: string[] }) => obstacle.layers),
  )
  const fromCircuitJsonOnly = getSimpleRouteJsonFromCircuitJson({
    circuitJson: remoteCircuitJson,
  }).simpleRouteJson
  const circuitJsonCopperPourLayers = new Set(
    fromCircuitJsonOnly.obstacles
      .filter((obstacle) => obstacle.isCopperPour)
      .flatMap((obstacle) => obstacle.layers),
  )

  const gndNet = circuit.db.source_net.list().find((net) => net.name === "GND")
  if (!gndNet) {
    throw new Error("Expected the GND source net")
  }

  expect(remoteCopperPourLayers.has("inner1")).toBe(true)
  expect(remoteCopperPourLayers.has("inner2")).toBe(false)
  expect(
    remoteSimpleRouteJson.obstacles.some(
      (obstacle: { isCopperPour?: boolean; connectedTo: string[] }) =>
        obstacle.isCopperPour &&
        obstacle.connectedTo.includes(gndNet.source_net_id),
    ),
  ).toBe(true)
  expect(circuitJsonCopperPourLayers.has("inner1")).toBe(false)
  expect(
    circuit.db.pcb_trace
      .list()
      .every((trace) =>
        trace.route.every(
          (point) => !("layer" in point) || point.layer !== "inner1",
        ),
      ),
  ).toBe(true)
  expect(circuit.selectAll("trace").length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
