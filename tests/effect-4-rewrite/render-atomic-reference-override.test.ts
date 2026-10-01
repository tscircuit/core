import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { PreventSchedulerYield } from "effect/References"
import { atomicRenderEffect } from "lib/effect/render-phase-programs"
import { AtomicBoundaryActor } from "./render-atomic-reference-helpers"

test("a phase locally protects an explicitly false scheduling reference and restores every outer value", () => {
  const actor = new AtomicBoundaryActor()
  const observations: boolean[] = []
  const readReference = Effect.withFiber((fiber) =>
    Effect.sync(() => observations.push(fiber.getRef(PreventSchedulerYield))),
  )
  const explicitOverride = Effect.gen(function* () {
    yield* readReference
    yield* Effect.withFiber((fiber) => {
      actor.onHook = () =>
        observations.push(fiber.getRef(PreventSchedulerYield))
      return actor.runRenderPhaseEffect("SourceRender")
    })
    yield* readReference
  }).pipe(Effect.provideService(PreventSchedulerYield, false))
  Effect.runSync(
    Effect.gen(function* () {
      yield* readReference
      yield* atomicRenderEffect(
        Effect.gen(function* () {
          yield* readReference
          yield* explicitOverride
          yield* readReference
        }),
      )
      yield* readReference
    }),
  )
  expect(observations).toEqual([false, true, false, true, false, true, false])
  expect(actor.writes).toBe(1)
  expect(actor.renderPhaseStates.SourceRender.initialized).toBe(true)
  expect(actor.events).toEqual(["SourceRender:start", "SourceRender:end"])
})
