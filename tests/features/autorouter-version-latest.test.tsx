import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("autorouterVersion latest uses AutoroutingPipelineSolver9_PreloadedTraceGraph", async () => {
  const { circuit } = getTestFixture()
  let input: SimpleRouteJson | undefined
  circuit.on("autorouting:start", (event) => {
    input = event.simpleRouteJson
  })
  let solverStartedName: string | undefined

  circuit.on("solver:started", (event) => {
    solverStartedName = event.solverName
  })

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
      autorouterVersion="latest"
    >
      <resistor name="R1" pcbX={-5} resistance={10000} footprint="0402" />
      <led name="LED1" pcbX={5} footprint="0603" />
      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
      <testpoint name="M1" pcbX={-4} pcbY={-4} />
      <testpoint name="M2" pcbX={4} pcbY={-4} />
      <trace
        name="MANUAL"
        from="M1.pin1"
        to="M2.pin1"
        pcbPath={[{ x: 2, y: -2 }]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(solverStartedName).toBe(
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  )
  const manualSourceTraceId = circuit.db.source_trace
    .list()
    .find((trace) => trace.name === "MANUAL")!.source_trace_id
  expect(
    input!.traces?.some(
      (trace) => trace.connection_name === manualSourceTraceId,
    ) ?? false,
  ).toBe(true)
  expect(
    input!.obstacles.some(
      (obstacle) => obstacle.connectedTo[0] === manualSourceTraceId,
    ),
  ).toBe(false)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
