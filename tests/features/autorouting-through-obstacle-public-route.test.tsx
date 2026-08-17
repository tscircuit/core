import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("through_obstacle claims the traversed assignable PCB via", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          const connection = simpleRouteJson.connections[0]
          const topPoint = connection.pointsToConnect.find(
            (point) => point.layer === "top",
          )!
          const bottomPoint = connection.pointsToConnect.find(
            (point) => point.layer === "bottom",
          )!
          const traceWidth =
            connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth
          const assignableViaObstacle = simpleRouteJson.obstacles.find(
            (obstacle) => obstacle.netIsAssignable,
          )!
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "trace_1",
              connection_name: connection.name,
              route: [
                {
                  route_type: "wire",
                  x: topPoint.x,
                  y: topPoint.y,
                  width: traceWidth,
                  layer: "top",
                },
                {
                  route_type: "wire",
                  x: 0,
                  y: 0,
                  width: traceWidth,
                  layer: "top",
                },
                {
                  route_type: "through_obstacle",
                  start: { x: 0, y: 0 },
                  end: { x: 0, y: 0 },
                  from_layer: "top",
                  to_layer: "bottom",
                  width: traceWidth,
                  circuitJsonMetadata:
                    assignableViaObstacle.circuitJsonMetadata,
                },
                {
                  route_type: "wire",
                  x: 0,
                  y: 0,
                  width: traceWidth,
                  layer: "bottom",
                },
                {
                  route_type: "wire",
                  x: bottomPoint.x,
                  y: bottomPoint.y,
                  width: traceWidth,
                  layer: "bottom",
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
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={5}
        pcbY={0}
        pcbRotation={180}
      />
      <via
        name="V1"
        pcbX={0}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.5}
        outerDiameter={1}
        netIsAssignable
      />
      <pcbnotetext
        text="Autorouter claims existing assignable via"
        pcbY={-3}
        fontSize={0.4}
      />
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
    end_layer: "bottom",
  })
  expect(throughPadPoints[0]).not.toHaveProperty("circuitJsonMetadata")
  const assignedVia = circuit.db.pcb_via.list()[0]
  expect(assignedVia.net_assigned).toBe(true)
  expect(assignedVia.pcb_trace_id).toBe(routedTrace.pcb_trace_id)
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
