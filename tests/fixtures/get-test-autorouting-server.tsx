import { serve } from "bun"
import { afterEach } from "bun:test"
import { MultilayerIjump } from "@tscircuit/infgrid-ijump-astar"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

export const getTestAutoroutingServer = () => {
  let currentJobId = 0
  const jobResults = new Map<string, any>()

  const server = serve({
    port: 0,
    fetch: async (req) => {
      if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 })
      }

      const url = new URL(req.url)
      const endpoint = url.pathname

      // Legacy solve endpoint
      if (endpoint === "/autorouting/solve") {
        const body = await req.json()
        let simpleRouteJson: SimpleRouteJson | undefined

        if (body.input_simple_route_json) {
          simpleRouteJson = body.input_simple_route_json as SimpleRouteJson
        } else if (body.input_circuit_json) {
          simpleRouteJson = getSimpleRouteJsonFromCircuitJson({
            circuitJson: body.input_circuit_json,
          })
        }

        if (!simpleRouteJson) {
          return new Response(
            JSON.stringify({
              error: { message: "Missing input data" },
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
          { headers: { "Content-Type": "application/json" } },
        )
      }

      // New job-based endpoints
      if (endpoint === "/autorouting/jobs/create") {
        const body = await req.json()
        const jobId = `job_${currentJobId++}`

        const simpleRouteJson = getSimpleRouteJsonFromCircuitJson({
          circuitJson: body.input_circuit_json,
        })

        const autorouter = new MultilayerIjump({
          input: simpleRouteJson,
          OBSTACLE_MARGIN: 0.2,
        })

        const traces = autorouter.solveAndMapToTraces()

        jobResults.set(jobId, {
          is_finished: true,
          is_started: true,
          is_running: true,
          output: { output_pcb_traces: traces },
        })

        return new Response(
          JSON.stringify({
            autorouting_job: {
              autorouting_job_id: jobId,
              is_running: true,
              is_started: true,
            },
          }),
          { headers: { "Content-Type": "application/json" } },
        )
      }

      if (endpoint === "/autorouting/jobs/get") {
        const jobId = url.searchParams.get("autorouting_job_id")
        const job = jobResults.get(jobId!)

        return new Response(
          JSON.stringify({
            autorouting_job: {
              autorouting_job_id: jobId,
              is_running: job?.is_running ?? false,
              is_started: job?.is_started ?? false,
              is_finished: job?.is_finished ?? false,
              has_error: job?.has_error ?? false,
              error: job?.error ?? null,
            },
          }),
          { headers: { "Content-Type": "application/json" } },
        )
      }

      if (endpoint === "/autorouting/jobs/get_output") {
        const jobId = url.searchParams.get("autorouting_job_id")
        const job = jobResults.get(jobId!)

        return new Response(
          JSON.stringify({
            autorouting_job_output: job?.output,
          }),
          { headers: { "Content-Type": "application/json" } },
        )
      }

      return new Response("Not found", { status: 404 })
    },
  })

  afterEach(() => {
    server.stop()
  })

  return {
    autoroutingServerUrl: `http://localhost:${server.port}/`,
    close: () => server.stop(),
  }
}
