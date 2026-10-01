import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { originalCoreError } from "lib/effect/core-error"
import { runLocalAutorouter } from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("routing failure preserves the original error and releases listeners", async () => {
  const router = new ControlledAutorouter()
  const error = new Error("controlled routing failure")
  const completed = Effect.runPromiseExit(
    runLocalAutorouter(router, {
      job: createRoutingJob(),
      onProgress: () => {},
    }),
  )
  router.error(error)
  const exit = await completed
  expect(Exit.isFailure(exit)).toBe(true)
  if (Exit.isFailure(exit)) expect(originalCoreError(exit.cause)).toBe(error)
  expect(router.stops).toBe(1)
  expect(router.listenersRemoved).toBe(3)
})
