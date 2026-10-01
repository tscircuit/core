import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import type { IRootCircuit } from "lib/IRootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise, coreSync } from "lib/effect/core-error"
import { flushRenderJobs } from "./render-helpers"

class OwnedPhase extends Renderable {
  readonly runtime = new CircuitRuntime(() => ({
    fetch: (url, options) => fetch(url, options),
  }))
  readonly events: { event: string; error?: string }[] = []
  signal?: AbortSignal
  release!: () => void
  commits = 0
  root: IRootCircuit = {
    effectRuntime: this.runtime,
    _hasRenderLifecycleListeners: false,
    emit: (event, payload) => this.events.push({ event, error: payload.error }),
    on: () => {},
    isDoneRendering: () => true,
    _hasIncompleteAsyncEffectsForPhase: () => false,
  }
  doInitialSourceRender() {
    this._queueEffect("owned_source", (job) =>
      Effect.gen({ self: this }, function* () {
        yield* corePromise((signal) => {
          this.signal = signal
          return new Promise<void>((resolve) => {
            this.release = resolve
          })
        })
        yield* coreSync(() => {
          job.commit(() => {
            this.commits++
          })
        })
      }),
    )
  }
}

test("removal interrupts an owned phase, settles its record exactly once and suppresses late commits", async () => {
  const owner = new OwnedPhase({})
  owner.runRenderPhase("SourceRender")
  expect(owner.runtime.activeJobCount).toBe(1)
  expect(owner._hasIncompleteAsyncEffects()).toBe(true)
  owner.shouldBeRemoved = true
  owner.runRenderPhase("SourceRender")
  await flushRenderJobs(owner)
  expect(owner.signal?.aborted).toBe(true)
  expect(owner.runtime.activeJobCount).toBe(0)
  expect(owner.events).toEqual([
    { event: "asyncEffect:start", error: undefined },
    { event: "asyncEffect:end", error: undefined },
  ])
  owner.release()
  for (let continuation = 0; continuation < 10; continuation++)
    await Promise.resolve()
  expect(owner.commits).toBe(0)
  expect(owner.events).toHaveLength(2)
  expect(owner.renderPhaseStates.SourceRender.initialized).toBe(false)
  await owner.runtime.dispose()
})
