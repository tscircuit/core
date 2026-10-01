import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { createRoutingJob } from "./routing-fixture"
import {
  createHttpRoutingFixture,
  provideRoutingServices,
} from "./routing-http-fixture"

test("a noncancellable fetch returning after interruption releases its unread response", async () => {
  const { circuit, board } = createHttpRoutingFixture()
  const controller = new AbortController()
  const job = createRoutingJob(controller)
  let finishFetch!: (response: Response) => void
  const pendingFetch = new Promise<Response>((resolve) => {
    finishFetch = resolve
  })
  let finishCancellation!: () => void
  const cancelledBody = new Promise<void>((resolve) => {
    finishCancellation = resolve
  })
  let cancellations = 0
  const completed = Effect.runPromiseExit(
    provideRoutingServices(board._runHttpAutoroutingEffect(job), {
      job,
      fetch: () => pendingFetch,
    }),
    { signal: controller.signal },
  )
  controller.abort()
  const exit = await completed
  expect(Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)).toBe(true)
  finishFetch(
    new Response(
      new ReadableStream<Uint8Array>({
        cancel() {
          cancellations++
          finishCancellation()
        },
      }),
    ),
  )
  await cancelledBody
  expect(cancellations).toBe(1)
  expect(board._asyncAutoroutingResult).toBeNull()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  await circuit.dispose()
})
