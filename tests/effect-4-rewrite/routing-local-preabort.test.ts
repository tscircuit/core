import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { runLocalAutorouter } from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("a stale owner never starts routing and releases the unused resource", async () => {
  const router = new ControlledAutorouter()
  const controller = new AbortController()
  controller.abort()
  const exit = await Effect.runPromiseExit(
    runLocalAutorouter(router, {
      job: createRoutingJob(controller),
      onProgress: () => {},
    }),
  )
  expect(Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)).toBe(true)
  expect(router.starts).toBe(0)
  expect(router.stops).toBe(1)
  expect(router.listenersRemoved).toBe(3)
})
