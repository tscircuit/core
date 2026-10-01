import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { corePromise } from "lib/effect/core-error"
import { flushRenderJobs } from "./render-helpers"

class ReparentedActor extends Renderable {
  constructor(public root: RootCircuit) {
    super({})
  }
}

test("completion releases the registering circuit's phase index after an actor changes roots", async () => {
  const originalCircuit = new RootCircuit()
  const replacementCircuit = new RootCircuit()
  const actor = new ReparentedActor(originalCircuit)
  let release!: () => void
  const originalEvents: string[] = []
  const replacementEvents: string[] = []
  originalCircuit.on("asyncEffect:start", () => originalEvents.push("start"))
  originalCircuit.on("asyncEffect:end", () => originalEvents.push("end"))
  replacementCircuit.on("asyncEffect:start", () =>
    replacementEvents.push("start"),
  )
  replacementCircuit.on("asyncEffect:end", () => replacementEvents.push("end"))
  actor._currentRenderPhase = "SourceRender"
  actor._queueEffect("origin", () =>
    corePromise(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    ),
  )
  expect(
    originalCircuit._hasIncompleteAsyncEffectsForPhase("SourceRender"),
  ).toBe(true)
  actor.root = replacementCircuit
  release()
  await flushRenderJobs(actor)
  expect(
    originalCircuit._hasIncompleteAsyncEffectsForPhase("SourceRender"),
  ).toBe(false)
  expect(
    replacementCircuit._hasIncompleteAsyncEffectsForPhase("SourceRender"),
  ).toBe(false)
  expect(originalCircuit.effectRuntime.activeJobCount).toBe(0)
  expect(originalEvents).toEqual(["start", "end"])
  expect(replacementEvents).toEqual([])
  await Promise.all([originalCircuit.dispose(), replacementCircuit.dispose()])
})
