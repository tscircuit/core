import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { PreventSchedulerYield } from "effect/References"
import { AtomicBoundaryActor } from "./render-atomic-reference-helpers"

test("a failing phase restores the caller's scheduling reference while preserving failure identity", () => {
  const actor = new AtomicBoundaryActor()
  const failure = { sentinel: "atomic phase failure" }
  let observedReference: boolean | undefined
  const program = Effect.withFiber((fiber) => {
    actor.onHook = () => {
      observedReference = fiber.getRef(PreventSchedulerYield)
      throw failure
    }
    return actor.runRenderPhaseEffect("SourceRender")
  }).pipe(
    Effect.catch((error) =>
      Effect.withFiber((fiber) =>
        Effect.succeed({
          cause: error.cause,
          restoredReference: fiber.getRef(PreventSchedulerYield),
        }),
      ),
    ),
  )
  const result = Effect.runSync(program)
  expect(result).toEqual({ cause: failure, restoredReference: false })
  if (result) expect(result.cause).toBe(failure)
  expect(observedReference).toBe(true)
  expect(actor.writes).toBe(1)
  expect(actor.renderPhaseStates.SourceRender.initialized).toBe(false)
  expect(actor.events).toEqual(["SourceRender:start"])
})
