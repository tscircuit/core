import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouter keeps board defaultTraceWidth separate from minTraceWidth", async () => {
  let capturedSimpleRouteJson: SimpleRouteJson | undefined

  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      defaultTraceWidth="0.3mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          capturedSimpleRouteJson = structuredClone(simpleRouteJson)

          return simpleRouteJson.connections.map(
            (connection): SimplifiedPcbTrace => ({
              type: "pcb_trace",
              pcb_trace_id: `${connection.name}_routed`,
              connection_name: connection.source_trace_id ?? connection.name,
              route: connection.pointsToConnect.map((point) => ({
                route_type: "wire",
                x: point.x,
                y: point.y,
                width:
                  connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth,
                layer: point.layer,
              })),
            }),
          )
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(capturedSimpleRouteJson?.minTraceWidth).toBe(0.15)
  expect(capturedSimpleRouteJson?.nominalTraceWidth).toBe(0.3)
  expect(capturedSimpleRouteJson?.connections[0]?.nominalTraceWidth).toBe(0.3)
  expect(capturedSimpleRouteJson?.connections[0]?.width).toBe(0.3)

  const routedWireWidths = circuit.db.pcb_trace
    .list()
    .flatMap((trace) =>
      trace.route
        .filter((point) => point.route_type === "wire")
        .map((point) => point.width),
    )

  expect(routedWireWidths.length).toBeGreaterThan(0)
  expect(routedWireWidths.every((width) => width === 0.3)).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
