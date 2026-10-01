import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { createRoutingJob } from "./routing-fixture"
import {
  createHttpRoutingFixture,
  provideRoutingServices,
} from "./routing-http-fixture"

test("interrupting queued routing cancels the polling sleep and suppresses output", async () => {
  const { circuit, board } = createHttpRoutingFixture("job")
  const controller = new AbortController()
  const job = createRoutingJob(controller)
  let polls = 0
  let observedPoll!: () => void
  const firstPoll = new Promise<void>((resolve) => {
    observedPoll = resolve
  })
  const completed = Effect.runPromiseExit(
    provideRoutingServices(board._runHttpAutoroutingEffect(job), {
      job,
      fetch: async (url) => {
        if (url.endsWith("/create"))
          return Response.json({
            autorouting_job: { autorouting_job_id: "cancelled_job" },
          })
        polls++
        observedPoll()
        return Response.json({
          autorouting_job: { is_finished: false, has_error: false },
        })
      },
    }),
    { signal: controller.signal },
  )
  await firstPoll
  await Promise.resolve()
  controller.abort()
  const exit = await completed
  expect(Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)).toBe(true)
  await new Promise((resolve) => setTimeout(resolve, 120))
  expect(polls).toBe(1)
  expect(board._asyncAutoroutingResult).toBeNull()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  await circuit.dispose()
})
