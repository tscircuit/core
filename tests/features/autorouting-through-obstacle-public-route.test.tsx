import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("through_obstacle route points are normalized before writing pcb_trace.route", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          const connection = simpleRouteJson.connections[0]
          const [start, end] = connection.pointsToConnect
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "trace_1",
              connection_name: connection.name,
              route: [
                {
                  route_type: "wire",
                  x: start.x,
                  y: start.y,
                  width:
                    connection.nominalTraceWidth ??
                    simpleRouteJson.minTraceWidth,
                  layer: start.layer,
                },
                {
                  route_type: "through_obstacle",
                  start: { x: start.x, y: start.y },
                  end: { x: end.x, y: end.y },
                  from_layer: start.layer,
                  to_layer: end.layer,
                  width:
                    connection.nominalTraceWidth ??
                    simpleRouteJson.minTraceWidth,
                },
              ],
            },
          ]
        }),
      }}
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const routedTrace = circuit.db.pcb_trace.list()[0]
  const throughPadPoints = routedTrace.route.filter(
    (p) => p.route_type === "through_pad",
  )

  expect(throughPadPoints).toHaveLength(1)
  expect(throughPadPoints[0]).toMatchObject({
    start_layer: "top",
    end_layer: "top",
  })
})
