import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import { PreventSchedulerYield } from "effect/References"
import { atomicRenderEffect } from "lib/effect/render-phase-programs"
import {
  AtomicBoundaryActor,
  interruptAtAtomicStart,
} from "./render-atomic-reference-helpers"

test("a fork inheriting scheduling references still protects its own phase against interruption", () => {
  const actor = new AtomicBoundaryActor()
  const childExit = Effect.runSync(
    atomicRenderEffect(
      Effect.gen(function* () {
        const child = yield* Effect.forkChild(
          Effect.withFiber((fiber) => {
            expect(fiber.getRef(PreventSchedulerYield)).toBe(true)
            return interruptAtAtomicStart(actor)
          }),
          { startImmediately: true, uninterruptible: false },
        )
        return yield* Fiber.await(child)
      }),
    ),
  )
  expect(Exit.isFailure(childExit)).toBe(true)
  expect(actor.writes).toBe(1)
  expect(actor.renderPhaseStates.SourceRender).toEqual({
    initialized: true,
    dirty: false,
  })
  expect(actor.events).toEqual(["SourceRender:start", "SourceRender:end"])
})
