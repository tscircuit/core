import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { runLocalAutorouter } from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("routing completion releases listeners and stops its router exactly once", async () => {
  const router = new ControlledAutorouter()
  const progress: number[] = []
  const completion = Effect.runPromise(
    runLocalAutorouter(router, {
      job: createRoutingJob(),
      onProgress: (event) => progress.push(event.progress),
    }),
  )
  expect(router.starts).toBe(1)
  router.progress()
  router.complete()
  expect(await completion).toEqual([])
  expect(progress).toEqual([0.5])
  expect(router.stops).toBe(1)
  expect(router.listenersRemoved).toBe(3)
  expect(router.completeHandlers).toHaveLength(0)
  expect(router.errorHandlers).toHaveLength(0)
  expect(router.progressHandlers).toHaveLength(0)
  router.progress()
  router.complete()
  expect(progress).toEqual([0.5])
  expect(router.stops).toBe(1)
})
