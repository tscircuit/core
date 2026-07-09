import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: board defaultTraceWidth is ignored by autorouted traces", async () => {
  const { circuit } = getTestFixture()
  const capturedSimpleRouteJsons: SimpleRouteJson[] = []

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      defaultTraceWidth="0.3mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(
          async (
            simpleRouteJson: SimpleRouteJson,
          ): Promise<SimplifiedPcbTrace[]> => {
            capturedSimpleRouteJsons.push(simpleRouteJson)

            return simpleRouteJson.connections.map((connection) => {
              const width =
                connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth

              return {
                type: "pcb_trace",
                pcb_trace_id: `${connection.name}_routed`,
                connection_name: connection.name,
                route: connection.pointsToConnect.map((point) => ({
                  route_type: "wire",
                  x: point.x,
                  y: point.y,
                  width,
                  layer: point.layer,
                })),
              }
            })
          },
        ),
      }}
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(capturedSimpleRouteJsons).toHaveLength(1)
  expect(capturedSimpleRouteJsons[0]!.minTraceWidth).toBe(0.15)
  expect(capturedSimpleRouteJsons[0]!.nominalTraceWidth).toBe(0.15)
  expect(capturedSimpleRouteJsons[0]!.connections[0]!.nominalTraceWidth).toBe(
    0.15,
  )

  const routedTrace = circuit.db.pcb_trace.list()[0]
  const routedWireWidths = routedTrace.route
    .filter((point) => point.route_type === "wire")
    .map((point) => point.width)
  // Bug repro: board.defaultTraceWidth is 0.3mm, but autorouted wires still
  // come out at 0.15mm. The expected fixed behavior should be [0.3, 0.3].
  expect(routedWireWidths).toEqual([0.15, 0.15])
})
