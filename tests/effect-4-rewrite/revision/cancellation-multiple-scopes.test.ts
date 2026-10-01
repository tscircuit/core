import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise } from "lib/effect/core-error"

class AdoptedActor extends Renderable {
  root: RootCircuit | null = null
}

test("a failed cancellation policy still drains both adopted and standalone ownership scopes", async () => {
  const actor = new AdoptedActor({})
  actor._currentRenderPhase = "SourceRender"
  const root = new RootCircuit()
  const standaloneFailure = new Error("standalone cancellation callback")
  const adoptedFailure = new Error("adopted cancellation callback")
  const signals: AbortSignal[] = []
  let releases = 0
  const queue = (failure: Error) =>
    actor._queueEffect(
      "adopted-resource",
      (job) =>
        Effect.gen(function* () {
          signals.push(job.signal)
          yield* Effect.acquireRelease(Effect.void, () =>
            Effect.sync(() => {
              releases++
            }),
          )
          yield* corePromise(() => new Promise<void>(() => {}))
        }),
      {
        onCancel: () => {
          throw failure
        },
      },
    )

  queue(standaloneFailure)
  const standalone = Reflect.get(actor, "_standaloneEffectRuntime")
  if (!(standalone instanceof CircuitRuntime))
    throw new Error("Expected standalone runtime")
  actor.root = root
  queue(adoptedFailure)
  let observed: unknown
  try {
    actor.cancelPendingEffects()
  } catch (failure) {
    observed = failure
  }
  try {
    expect(observed).toBeInstanceOf(AggregateError)
    if (observed instanceof AggregateError)
      expect(observed.errors).toEqual([adoptedFailure, standaloneFailure])
    expect(signals.map((signal) => signal.aborted)).toEqual([true, true])
  } finally {
    await Promise.all([root.dispose(), standalone.dispose()])
  }
  expect(releases).toBe(2)
  expect(root.effectRuntime.activeJobCount).toBe(0)
  expect(standalone.activeJobCount).toBe(0)
})
