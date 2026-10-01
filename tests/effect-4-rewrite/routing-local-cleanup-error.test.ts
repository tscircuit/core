import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { originalCoreError } from "lib/effect/core-error"
import { runLocalAutorouter } from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("listener cleanup failures still release other listeners and stop once", async () => {
  const router = new ControlledAutorouter()
  const error = new Error("listener cleanup failure")
  router.removeListener = () => {
    router.listenersRemoved++
    throw error
  }
  const completed = Effect.runPromiseExit(
    runLocalAutorouter(router, {
      job: createRoutingJob(),
      onProgress: () => {},
    }),
  )
  router.complete()
  const exit = await completed
  expect(Exit.isFailure(exit)).toBe(true)
  if (Exit.isFailure(exit)) expect(originalCoreError(exit.cause)).toBe(error)
  expect(router.listenersRemoved).toBe(3)
  expect(router.stops).toBe(1)
})
