import { serve } from "bun"
import { afterEach } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

export const getTestAutoroutingServer = ({
  requireDisplayName = false,
  requireServerCacheEnabled = false,
  failInFirstTrace = false,
  simulateIncompleteAutorouting = false,
}: {
  requireDisplayName?: boolean
  requireServerCacheEnabled?: boolean
  failInFirstTrace?: boolean
  simulateIncompleteAutorouting?: boolean
} = {}) => {
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
          }).simpleRouteJson
        }

        if (!simpleRouteJson) {
          return new Response(
            JSON.stringify({
              error: { message: "Missing input data" },
            }),
            { status: 400 },
          )
        }

        const autorouter = new TscircuitAutorouter(simpleRouteJson, {
          autorouterVersion: "v1",
        })

        const traces = autorouter.solveSync()

        // Simulate failure in the first trace if the flag is set
        if (failInFirstTrace && traces.length > 0) {
          return new Response(
            JSON.stringify({
              error: { message: "Failed to compute first trace" },
            }),
            { status: 500 },
          )
        }

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

        if (requireDisplayName && !body.display_name) {
          return new Response(
            JSON.stringify({
              error: { message: "Missing display_name" },
            }),
            { status: 400 },
          )
        }

        if (requireServerCacheEnabled && !body.server_cache_enabled) {
          return new Response(
            JSON.stringify({
              error: { message: "Missing server_cache_enabled" },
            }),
            { status: 400 },
          )
        }

        const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
          circuitJson: body.input_circuit_json,
        })

        const autorouter = new TscircuitAutorouter(simpleRouteJson as any, {
          autorouterVersion: "v1",
        })

        const traces = autorouter.solveSync()

        // Simulate failure in the first trace if the flag is set
        if (failInFirstTrace && traces.length > 0) {
          jobResults.set(jobId, {
            is_finished: false,
            is_started: true,
            is_running: false,
            has_error: true,
            error: {
              message:
                "Failed to compute first trace (failInFirstTrace simulated error)",
            },
          })

          return new Response(
            JSON.stringify({
              autorouting_job: {
                autorouting_job_id: jobId,
                is_running: false,
                is_started: true,
                has_error: true,
                error:
                  "Failed to compute first trace (failInFirstTrace simulated error)",
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          )
        }

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
        const body = await req.json()
        const jobId = body.autorouting_job_id
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
        const body = await req.json()
        const jobId = body.autorouting_job_id
        const job = jobResults.get(jobId!)

        if (
          simulateIncompleteAutorouting &&
          job?.output?.output_pcb_traces?.length > 0
        ) {
          // remove the first trace
          job.output.output_pcb_traces.shift()
        }

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

  global.servers?.push({
    url: `http://localhost:${server.port}/`,
    close: () => server.stop(),
  })

  return {
    autoroutingServerUrl: `http://localhost:${server.port}/`,
    close: () => server.stop(),
  }
}
