import { serve } from "bun"
import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a VM routing connection keeps its owner when the router puts it on GND", async () => {
  const { circuit } = getTestFixture({
    platform: { allowLegacyAutorouters: true },
  })
  const server = serve({
    port: 0,
    async fetch(request) {
      const { input_simple_route_json: simpleRouteJson } =
        (await request.json()) as { input_simple_route_json: SimpleRouteJson }
      const vm = circuit.db.source_net.getWhere({ name: "VM" })!
      const gnd = circuit.db.source_net.getWhere({ name: "GND" })!
      const groundConnection = simpleRouteJson.connections.find(
        (connection) => connection.name === gnd.source_net_id,
      )!
      return Response.json({
        autorouting_result: {
          output_simple_route_json: {
            ...simpleRouteJson,
            traces: [
              {
                type: "pcb_trace",
                pcb_trace_id: "wrong_vm_route",
                connection_name: vm.source_net_id,
                route: groundConnection.pointsToConnect.map((point) => ({
                  route_type: "wire",
                  x: point.x,
                  y: point.y,
                  layer: point.layer,
                  width: 0.2,
                })),
              },
            ],
          },
        },
      })
    },
  })

  try {
    circuit.add(
      <board
        width={12}
        height={8}
        schematicDisabled
        autorouter={{
          serverUrl: `http://localhost:${server.port}`,
          serverMode: "solve-endpoint",
          inputFormat: "simplified",
        }}
      >
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0603"
          pcbX={-3}
          connections={{ pin1: "net.VM", pin2: "net.GND" }}
        />
        <capacitor
          name="C2"
          capacitance="100nF"
          footprint="0603"
          pcbX={3}
          connections={{ pin1: "net.VM", pin2: "net.GND" }}
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const vm = circuit.db.source_net.getWhere({ name: "VM" })!
    const trace = circuit.db.pcb_trace.list()[0]
    expect(trace.source_trace_id).toBe(vm.source_net_id)
    expect(circuit.db.pcb_trace_error.list()).toContainEqual(
      expect.objectContaining({
        pcb_trace_id: trace.pcb_trace_id,
        message: expect.stringContaining('"C1.pin2"'),
      }),
    )
  } finally {
    server.stop(true)
  }
})
