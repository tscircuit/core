import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouter traceClearance is sent to the solver", async () => {
  const { circuit } = getTestFixture()
  let receivedSimpleRouteJson: SimpleRouteJson | undefined

  circuit.add(
    <board
      width="14mm"
      height="10mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        traceClearance: "0.8mm",
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          receivedSimpleRouteJson = structuredClone(simpleRouteJson)
          const [connection] = simpleRouteJson.connections
          const [start, end] = connection.pointsToConnect
          const traceWidth =
            connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth
          const receivedClearance =
            simpleRouteJson.defaultObstacleMargin ?? 0.25
          const detourY = 1.2 + receivedClearance + traceWidth / 2

          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "pcb_trace_clearance_repro",
              connection_name: connection.name,
              route: [
                {
                  route_type: "wire",
                  x: start.x,
                  y: start.y,
                  width: traceWidth,
                  layer: start.layer,
                },
                {
                  route_type: "wire",
                  x: start.x,
                  y: detourY,
                  width: traceWidth,
                  layer: start.layer,
                },
                {
                  route_type: "wire",
                  x: end.x,
                  y: detourY,
                  width: traceWidth,
                  layer: end.layer,
                },
                {
                  route_type: "wire",
                  x: end.x,
                  y: end.y,
                  width: traceWidth,
                  layer: end.layer,
                },
              ],
            },
          ]
        }),
      }}
    >
      <resistor name="R_LEFT" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R_OBSTACLE" resistance="1k" footprint="1206" pcbX={0} />
      <resistor name="R_RIGHT" resistance="1k" footprint="0402" pcbX={5} />
      <trace from=".R_LEFT > .pin2" to=".R_RIGHT > .pin1" />
      <pcbnotetext
        text="Requested trace clearance: 0.8 mm"
        pcbY={-4}
        fontSize="0.4mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(receivedSimpleRouteJson?.defaultObstacleMargin).toBe(0.8)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
