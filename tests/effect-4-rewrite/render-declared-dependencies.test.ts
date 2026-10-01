import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { Renderable } from "lib/components/base-components/Renderable"
import { corePromise } from "lib/effect/core-error"
import {
  type RenderPhase,
  asyncPhaseDependencies,
} from "lib/effect/render-phase-definitions"
import { attachRenderChild, flushRenderJobs } from "./render-helpers"

class DeferredDependency extends Renderable {
  release!: () => void
  queueInPhase(phase: RenderPhase) {
    this._currentRenderPhase = phase
    this._queueEffect("dependency", () =>
      corePromise(
        () =>
          new Promise<void>((resolve) => {
            this.release = resolve
          }),
      ),
    )
  }
}

test("every declared Effect phase dependency waits for descendant jobs and resumes after registry cleanup", async () => {
  let dependencyCount = 0
  for (const [dependentPhaseName, dependencies] of Object.entries(
    asyncPhaseDependencies,
  )) {
    const dependentPhase = dependentPhaseName as RenderPhase
    for (const dependencyPhase of dependencies) {
      dependencyCount++
      const parent = new DeferredDependency({})
      const child = new DeferredDependency({})
      attachRenderChild(parent, child)
      child.queueInPhase(dependencyPhase)
      Effect.runSync(parent.runRenderPhaseEffect(dependentPhase))
      expect(parent.renderPhaseStates[dependentPhase].initialized).toBe(false)
      expect(
        parent._hasIncompleteAsyncEffectsInSubtreeForPhase(dependencyPhase),
      ).toBe(true)
      child.release()
      await flushRenderJobs(parent)
      Effect.runSync(parent.runRenderPhaseEffect(dependentPhase))
      expect(parent.renderPhaseStates[dependentPhase].initialized).toBe(true)
      expect(
        parent._hasIncompleteAsyncEffectsInSubtreeForPhase(dependencyPhase),
      ).toBe(false)
    }
  }
  expect(dependencyCount).toBeGreaterThan(90)
})
