import { expect, spyOn, test } from "bun:test"
import * as Effect from "effect/Effect"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { corePromise } from "lib/effect/core-error"
import { flushRenderJobs } from "./render-helpers"

class ResourceActor extends Renderable {
  constructor(readonly root: RootCircuit) {
    super({})
  }
}

test("owned job scopes release acquired resources on success, failure and interruption before reporting completion", async () => {
  const errorLog = spyOn(console, "error").mockImplementation(() => {})
  try {
    for (const outcome of ["success", "failure", "interruption"] as const) {
      const circuit = new RootCircuit()
      const actor = new ResourceActor(circuit)
      let activeResources = 0
      let cleanupCount = 0
      let completeCount = 0
      let observedFailure: string | undefined
      let release!: () => void
      let fail!: (cause: unknown) => void
      const pending = new Promise<void>((resolve, reject) => {
        release = resolve
        fail = reject
      })
      circuit.on("asyncEffect:end", (payload) => {
        expect(activeResources).toBe(0)
        expect(circuit.effectRuntime.activeJobCount).toBe(0)
        completeCount++
        observedFailure = payload.error
      })
      actor._currentRenderPhase = "SourceRender"
      actor._queueEffect("resource", () =>
        Effect.gen(function* () {
          yield* Effect.acquireRelease(
            Effect.sync(() => {
              activeResources++
            }),
            () =>
              Effect.sync(() => {
                activeResources--
                cleanupCount++
              }),
          )
          yield* corePromise(() => pending)
        }),
      )
      expect(activeResources).toBe(1)
      expect(actor.getPendingAsyncEffectNames()).toEqual(["resource"])
      if (outcome === "success") release()
      if (outcome === "failure") fail(new Error("resource failure"))
      if (outcome === "interruption") circuit.effectRuntime.cancelSubtree(actor)
      await flushRenderJobs(actor)
      expect(activeResources).toBe(0)
      expect(cleanupCount).toBe(1)
      expect(completeCount).toBe(1)
      expect(observedFailure).toBe(
        outcome === "failure" ? "Error: resource failure" : undefined,
      )
      expect(actor.getPendingAsyncEffectNames()).toEqual([])
      release()
      for (let continuation = 0; continuation < 10; continuation++)
        await Promise.resolve()
      expect(cleanupCount).toBe(1)
      expect(completeCount).toBe(1)
      await circuit.dispose()
    }
    expect(errorLog).toHaveBeenCalledTimes(1)
  } finally {
    errorLog.mockRestore()
  }
})
