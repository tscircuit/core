import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { PreventSchedulerYield } from "effect/References"
import { atomicRenderEffect } from "lib/effect/render-phase-programs"
import {
  AtomicBoundaryActor,
  interruptAtAtomicStart,
} from "./render-atomic-reference-helpers"

test("a phase reapplies its interruption mask inside an explicitly interruptible render region", () => {
  const actor = new AtomicBoundaryActor()
  const exit = Effect.runSyncExit(
    atomicRenderEffect(
      Effect.interruptible(
        Effect.withFiber((fiber) => {
          expect(fiber.getRef(PreventSchedulerYield)).toBe(true)
          return interruptAtAtomicStart(actor)
        }),
      ),
    ),
  )
  expect(Exit.isFailure(exit)).toBe(true)
  expect(actor.writes).toBe(1)
  expect(actor.renderPhaseStates.SourceRender).toEqual({
    initialized: true,
    dirty: false,
  })
  expect(actor.events).toEqual(["SourceRender:start", "SourceRender:end"])
})
