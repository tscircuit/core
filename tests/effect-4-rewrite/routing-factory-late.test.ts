import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { acquireLocalAutorouter } from "lib/effect/routing-local-router"
import { ControlledAutorouter, createRoutingJob } from "./routing-fixture"

test("a custom factory finishing after interruption has its router reclaimed", async () => {
  const router = new ControlledAutorouter()
  const controller = new AbortController()
  let finishFactory!: (router: ControlledAutorouter) => void
  const factory = new Promise<ControlledAutorouter>((resolve) => {
    finishFactory = resolve
  })
  const completed = Effect.runPromiseExit(
    Effect.scoped(
      acquireLocalAutorouter({
        job: createRoutingJob(controller),
        create: () => factory,
      }),
    ),
    { signal: controller.signal },
  )
  controller.abort()
  const exit = await completed
  expect(Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)).toBe(true)
  expect(router.stops).toBe(0)
  finishFactory(router)
  await factory
  await Promise.resolve()
  expect(router.starts).toBe(0)
  expect(router.stops).toBe(1)
})
