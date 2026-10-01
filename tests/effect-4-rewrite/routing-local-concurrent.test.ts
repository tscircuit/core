import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { runLocalAutorouter } from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("cancelling one routing job leaves concurrent resources independent", async () => {
  const first = new ControlledAutorouter()
  const second = new ControlledAutorouter()
  const controller = new AbortController()
  const cancelled = Effect.runPromiseExit(
    runLocalAutorouter(first, {
      job: createRoutingJob(controller),
      onProgress: () => {},
    }),
    { signal: controller.signal },
  )
  const completed = Effect.runPromise(
    runLocalAutorouter(second, {
      job: createRoutingJob(),
      onProgress: () => {},
    }),
  )
  controller.abort()
  const exit = await cancelled
  expect(Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)).toBe(true)
  expect(second.isRouting).toBe(true)
  expect(second.stops).toBe(0)
  second.complete()
  expect(await completed).toEqual([])
  expect(first.stops).toBe(1)
  expect(second.stops).toBe(1)
})
