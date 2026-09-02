import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("raw circuit-json solve endpoint also receives unbroken copper-pour Simple Route JSON", async () => {
  const { autoroutingServerUrl, capturedSolveBodies } =
    getTestAutoroutingServer()

  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={4}
      autorouter={{
        serverUrl: autoroutingServerUrl,
        serverMode: "solve-endpoint",
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

  expect(capturedSolveBodies).toHaveLength(1)
  const solveBody = capturedSolveBodies[0]
  expect(solveBody.input_circuit_json).toBeDefined()
  expect(solveBody.input_simple_route_json).toBeDefined()

  const remoteCopperPourLayers = new Set(
    solveBody.input_simple_route_json.obstacles
      .filter((obstacle: { isCopperPour?: boolean }) => obstacle.isCopperPour)
      .flatMap((obstacle: { layers: string[] }) => obstacle.layers),
  )
  const fromCircuitJsonOnly = getSimpleRouteJsonFromCircuitJson({
    circuitJson: solveBody.input_circuit_json,
  }).simpleRouteJson

  expect(remoteCopperPourLayers.has("inner1")).toBe(true)
  expect(remoteCopperPourLayers.has("inner2")).toBe(false)
  expect(
    fromCircuitJsonOnly.obstacles.some((obstacle) => obstacle.isCopperPour),
  ).toBe(false)
  expect(circuit.selectAll("trace").length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
