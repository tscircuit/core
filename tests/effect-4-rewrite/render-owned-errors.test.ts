import { expect, spyOn, test } from "bun:test"
import * as Effect from "effect/Effect"
import type { IRootCircuit } from "lib/IRootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { flushRenderJobs } from "./render-helpers"

class FailedOwnedPhase extends Renderable {
  readonly runtime = new CircuitRuntime(() => ({
    fetch: (url, options) => fetch(url, options),
  }))
  readonly failures: string[] = []
  readonly starts: string[] = []
  root: IRootCircuit = {
    effectRuntime: this.runtime,
    _hasRenderLifecycleListeners: false,
    emit: (event, payload) => {
      if (event === "asyncEffect:start") this.starts.push(payload.effectName)
      if (event === "asyncEffect:end") this.failures.push(payload.error)
    },
    on: () => {},
    isDoneRendering: () => true,
    _hasIncompleteAsyncEffectsForPhase: () => false,
  }
}

test("typed failures settle concurrent phase records once, preserve errors and release the owned registry", async () => {
  const owner = new FailedOwnedPhase({})
  const errorLog = spyOn(console, "error").mockImplementation(() => {})
  try {
    owner._currentRenderPhase = "SourceRender"
    const failures = [new Error("owned failure"), "string failure", undefined]
    for (const [failureIndex, failure] of failures.entries()) {
      owner._queueEffect(`failure_${failureIndex}`, () => Effect.fail(failure))
    }
    expect(owner.starts).toEqual(["failure_0", "failure_1", "failure_2"])
    await flushRenderJobs(owner)
    expect(owner.failures).toEqual(failures.map(String))
    expect(errorLog).toHaveBeenCalledTimes(3)
    expect(owner.runtime.activeJobCount).toBe(0)
    expect(
      owner._hasIncompleteAsyncEffectsInSubtreeForPhase("SourceRender"),
    ).toBe(false)
    owner.runRenderPhase("CheckRefDesConvention")
    expect(owner.renderPhaseStates.CheckRefDesConvention.initialized).toBe(true)
  } finally {
    errorLog.mockRestore()
    await owner.runtime.dispose()
  }
})
