import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { runLocalAutorouter } from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("synchronous complete observers finish before the routing continuation", async () => {
  const router = new ControlledAutorouter()
  const order: string[] = []
  router.onStart = () => {
    order.push("start")
    router.complete()
    order.push("other_observers")
  }
  const completed = Effect.runPromise(
    runLocalAutorouter(router, {
      job: createRoutingJob(),
      onProgress: () => {},
    }).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          order.push("continuation")
        }),
      ),
    ),
  )
  expect(order).toEqual(["start", "other_observers"])
  await completed
  expect(order).toEqual(["start", "other_observers", "continuation"])
  expect(router.stops).toBe(1)
})
