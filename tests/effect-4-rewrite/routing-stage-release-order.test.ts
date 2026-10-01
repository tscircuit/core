import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import {
  acquireLocalAutorouter,
  runLocalAutorouter,
} from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("stage-owned routers stop after output reads and before the next stage", async () => {
  const router = new ControlledAutorouter()
  const order: string[] = []
  router.onStart = () => router.complete()
  router.stop = () => {
    router.stops++
    order.push("stop")
  }
  const job = createRoutingJob()
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* Effect.scoped(
        Effect.gen(function* () {
          const acquired = yield* acquireLocalAutorouter({
            job,
            create: () => router,
          })
          yield* runLocalAutorouter(acquired, {
            job,
            onProgress: () => {},
            stopOnRelease: false,
          })
          expect(router.stops).toBe(0)
          order.push("read_output")
        }),
      )
      order.push("next_stage")
    }),
  )
  expect(order).toEqual(["read_output", "stop", "next_stage"])
  expect(router.stops).toBe(1)
  expect(router.listenersRemoved).toBe(3)
})
