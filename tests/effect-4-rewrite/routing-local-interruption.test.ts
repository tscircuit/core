import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { runLocalAutorouter } from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("interrupting routing releases resources and suppresses captured late callbacks", async () => {
  const router = new ControlledAutorouter()
  const controller = new AbortController()
  const progress: number[] = []
  const completed = Effect.runPromiseExit(
    runLocalAutorouter(router, {
      job: createRoutingJob(controller),
      onProgress: (event) => progress.push(event.progress),
    }),
    { signal: controller.signal },
  )
  const lateComplete = router.completeHandlers[0]
  const lateProgress = router.progressHandlers[0]
  controller.abort()
  const exit = await completed
  expect(Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)).toBe(true)
  lateComplete?.({ type: "complete", traces: [] })
  lateProgress?.({ type: "progress", steps: 99, progress: 1 })
  expect(router.starts).toBe(1)
  expect(router.stops).toBe(1)
  expect(router.listenersRemoved).toBe(3)
  expect(progress).toEqual([])
})
