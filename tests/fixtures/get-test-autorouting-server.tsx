import { serve } from "bun"
import { afterEach } from "bun:test"
import { MultilayerIjump } from "@tscircuit/infgrid-ijump-astar"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

export const getTestAutoroutingServer = () => {
  const server = serve({
    port: 0,
    fetch: async (req) => {
      if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 })
      }

      const body = await req.json()

      let simpleRouteJson: SimpleRouteJson | undefined
      if (body.input_simple_route_json) {
        simpleRouteJson = body.input_simple_route_json as SimpleRouteJson
      } else if (body.input_circuit_json) {
        simpleRouteJson = getSimpleRouteJsonFromCircuitJson({
          circuitJson: body.input_circuit_json,
        })
      }

      try {
        if (!simpleRouteJson) {
          return new Response(
            JSON.stringify({
              error: { message: "Missing simple_route_json in request body" },
            }),
            { status: 400 },
          )
        }

        const autorouter = new MultilayerIjump({
          input: simpleRouteJson,
          OBSTACLE_MARGIN: 0.2,
        })

        const traces = autorouter.solveAndMapToTraces()

        return new Response(
          JSON.stringify({
            autorouting_result: {
              output_simple_route_json: {
                ...simpleRouteJson,
                traces,
              },
            },
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        )
      } catch (e: any) {
        return new Response(
          JSON.stringify({
            error: e.message,
          }),
          { status: 500 },
        )
      }
    },
  })

  afterEach(() => {
    server.stop()
  })

  return {
    autoroutingServerUrl: `http://localhost:${server.port}/autorouting/solve`,
    close: () => server.stop(),
  }
}
