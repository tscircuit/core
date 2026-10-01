import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { createRoutingJob } from "./routing-fixture"
import {
  createHttpRoutingFixture,
  provideRoutingServices,
} from "./routing-http-fixture"

test("Effect queued HTTP routing polls and commits the same output shape", async () => {
  const { circuit, board } = createHttpRoutingFixture("job")
  const requests: string[] = []
  let polls = 0
  const job = createRoutingJob()
  await Effect.runPromise(
    provideRoutingServices(board._runHttpAutoroutingEffect(job), {
      job,
      fetch: async (url, options) => {
        requests.push(url)
        if (url.endsWith("/create"))
          return Response.json({
            autorouting_job: { autorouting_job_id: "controlled_job" },
          })
        expect(JSON.parse(String(options?.body))).toEqual({
          autorouting_job_id: "controlled_job",
        })
        if (url.endsWith("/get"))
          return Response.json({
            autorouting_job: { is_finished: ++polls === 2, has_error: false },
          })
        return Response.json({
          autorouting_job_output: { output_pcb_traces: [] },
        })
      },
    }),
  )
  expect(requests.map((url) => url.split("/").at(-1))).toEqual([
    "create",
    "get",
    "get",
    "get_output",
  ])
  expect(board._asyncAutoroutingResult).toEqual({ output_pcb_traces: [] })
  expect(board.renderPhaseStates.PcbTraceRender.dirty).toBe(true)
  await circuit.dispose()
})
