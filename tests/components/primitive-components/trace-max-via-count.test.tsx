import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("trace maxViaCount is enforced by the autorouter", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="12mm"
      height="8mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          const connection = simpleRouteJson.connections[0]!
          const [start, end] = connection.pointsToConnect
          const width =
            connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth

          if (Reflect.get(connection, "maxViaCount") === 0) {
            return [
              {
                type: "pcb_trace",
                pcb_trace_id: "trace_without_vias",
                connection_name: connection.name,
                route: [
                  { route_type: "wire", ...start, width },
                  { route_type: "wire", ...end, width },
                ],
              },
            ]
          }

          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "trace_with_two_vias",
              connection_name: connection.name,
              route: [
                { route_type: "wire", ...start, width },
                {
                  route_type: "wire",
                  x: -1,
                  y: 0,
                  width,
                  layer: "top",
                },
                {
                  route_type: "via",
                  x: -1,
                  y: 0,
                  from_layer: "top",
                  to_layer: "bottom",
                },
                {
                  route_type: "wire",
                  x: -1,
                  y: 0,
                  width,
                  layer: "bottom",
                },
                {
                  route_type: "wire",
                  x: 1,
                  y: 0,
                  width,
                  layer: "bottom",
                },
                {
                  route_type: "via",
                  x: 1,
                  y: 0,
                  from_layer: "bottom",
                  to_layer: "top",
                },
                {
                  route_type: "wire",
                  x: 1,
                  y: 0,
                  width,
                  layer: "top",
                },
                { route_type: "wire", ...end, width },
              ],
            },
          ]
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" maxViaCount={0} />
      <pcbnotetext text="MAX VIA COUNT: 0" pcbY={-2.5} fontSize={0.4} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(circuit.db.source_trace.list()[0].max_via_count).toBe(0)
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    showErrorsInTextOverlay: true,
  })

  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("vias")),
  ).toHaveLength(0)
})
