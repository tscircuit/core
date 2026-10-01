import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { createRoutingJob } from "./routing-fixture"
import {
  createHttpRoutingFixture,
  provideRoutingServices,
} from "./routing-http-fixture"

test("routing interruption aborts the request after headers during body consumption", async () => {
  const { circuit, board } = createHttpRoutingFixture()
  const controller = new AbortController()
  const job = createRoutingJob(controller)
  let signalRead!: () => void
  const reading = new Promise<void>((resolve) => {
    signalRead = resolve
  })
  let abortedRequests = 0
  const completed = Effect.runPromiseExit(
    provideRoutingServices(board._runHttpAutoroutingEffect(job), {
      job,
      fetch: async (_url, options) => {
        const stream = new ReadableStream<Uint8Array>({
          start(streamController) {
            options?.signal?.addEventListener(
              "abort",
              () => {
                abortedRequests++
                streamController.error(options.signal?.reason)
              },
              { once: true },
            )
            streamController.enqueue(
              new TextEncoder().encode('{"autorouting_result":'),
            )
          },
          pull() {
            signalRead()
          },
        })
        return new Response(stream, {
          headers: { "Content-Type": "application/json" },
        })
      },
    }),
    { signal: controller.signal },
  )
  await reading
  controller.abort()
  const exit = await completed
  expect(Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)).toBe(true)
  expect(abortedRequests).toBe(1)
  expect(board._asyncAutoroutingResult).toBeNull()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  await circuit.dispose()
})
