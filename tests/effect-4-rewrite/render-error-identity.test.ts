import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { Renderable } from "lib/components/base-components/Renderable"
import { CoreError } from "lib/effect/core-error"

class ThrowingPhase extends Renderable {
  failure: unknown
  throwNow = true
  doInitialSourceRender() {
    if (this.throwNow) throw this.failure
  }
  updateSourceRender() {
    if (this.throwNow) throw this.failure
  }
  removeSourceRender() {
    if (this.throwNow) throw this.failure
  }
}

test("Effect phase failures preserve original thrown values and each lifecycle's pre-failure state", () => {
  const failures = [
    new Error("sentinel"),
    "sentinel",
    undefined,
    { sentinel: true },
  ]
  for (const failure of failures) {
    for (const transition of ["initial", "update", "remove"] as const) {
      const renderable = new ThrowingPhase({})
      renderable.failure = failure
      if (transition !== "initial")
        renderable.renderPhaseStates.SourceRender.initialized = true
      renderable.renderPhaseStates.SourceRender.dirty = true
      renderable.shouldBeRemoved = transition === "remove"
      const exit = Effect.runSyncExit(
        renderable.runRenderPhaseEffect("SourceRender"),
      )
      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const typedFailure = Cause.squash(exit.cause)
        expect(typedFailure).toBeInstanceOf(CoreError)
        if (typedFailure instanceof CoreError)
          expect(typedFailure.cause).toBe(failure)
      }
      let didThrow = false
      try {
        renderable.runRenderPhase("SourceRender")
      } catch (error) {
        didThrow = true
        expect(error).toBe(failure)
      }
      expect(didThrow).toBe(true)
      expect(renderable.renderPhaseStates.SourceRender).toEqual({
        initialized: transition !== "initial",
        dirty: transition !== "initial",
      })
    }
  }
})
