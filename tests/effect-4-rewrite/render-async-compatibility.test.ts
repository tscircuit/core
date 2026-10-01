import { expect, test } from "bun:test"
import type { IRootCircuit } from "lib/IRootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"
import { flushRenderJobs } from "./render-helpers"

class EagerAsyncOwner extends Renderable {
  events: { name: string; id: string }[] = []
  release!: () => void
  root: IRootCircuit = {
    _hasRenderLifecycleListeners: false,
    emit: (event, payload) => {
      if (event === "asyncEffect:start")
        this.events.push({
          name: payload.effectName,
          id: payload.asyncEffectId,
        })
    },
    on: () => {},
    isDoneRendering: () => true,
    _hasIncompleteAsyncEffectsForPhase: () => false,
  }
}

test("the Promise adapter preserves eager exceptions, nested job IDs and first-microtask completion", async () => {
  const owner = new EagerAsyncOwner({})
  owner._currentRenderPhase = "SourceRender"
  const failure = { eager: true }
  let captured: unknown
  try {
    owner._queueAsyncEffect("throw", () => {
      throw failure
    })
  } catch (error) {
    captured = error
  }
  expect(captured).toBe(failure)
  expect(owner.events).toEqual([])
  expect(owner._hasIncompleteAsyncEffects()).toBe(false)
  let eager = false
  owner._queueAsyncEffect("outer", () => {
    eager = true
    owner._queueAsyncEffect("inner", () => Promise.resolve())
    return new Promise<void>((resolve) => {
      owner.release = resolve
    })
  })
  expect(eager).toBe(true)
  expect(owner.events.map((event) => event.name)).toEqual(["inner", "outer"])
  const innerSequence = Number(owner.events[0].id.split(":")[1])
  const outerSequence = Number(owner.events[1].id.split(":")[1])
  expect(innerSequence).toBe(outerSequence + 1)
  owner.release()
  await Promise.resolve()
  expect(owner._hasIncompleteAsyncEffects()).toBe(false)
  await flushRenderJobs(owner)
})
