import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import type { IRootCircuit } from "lib/IRootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"

class AbortDuringPhase extends Renderable {
  readonly controller = new AbortController()
  readonly sourceEvents: string[] = []
  writes = 0
  constructor(readonly abortAt: "start" | "hook" | "end") {
    super({})
  }
  root: IRootCircuit = {
    emit: (event) => {
      if (event === "renderable:renderLifecycle:SourceRender:start") {
        this.sourceEvents.push("start")
        if (this.abortAt === "start") this.controller.abort()
      }
      if (event === "renderable:renderLifecycle:SourceRender:end") {
        this.sourceEvents.push("end")
        if (this.abortAt === "end") this.controller.abort()
      }
    },
    on: () => {},
    isDoneRendering: () => true,
    _hasIncompleteAsyncEffectsForPhase: () => false,
  }
  doInitialSourceRender() {
    this.writes++
    if (this.abortAt === "hook") this.controller.abort()
  }
}

test("abort inside a phase lifecycle defers interruption until the hook, state and end event commit atomically", () => {
  for (const abortAt of ["start", "hook", "end"] as const) {
    const owner = new AbortDuringPhase(abortAt)
    let interrupted = false
    let start!: () => void
    const ready = Effect.callback<void>((resume) => {
      start = () => resume(Effect.void)
    })
    Effect.runCallback(
      Effect.andThen(ready, owner.runRenderPhaseEffect("SourceRender")),
      {
        signal: owner.controller.signal,
        onExit: (exit) => {
          interrupted = Exit.isFailure(exit)
        },
      },
    )
    // Effect 4 registers RunOptions.signal only after its eager synchronous
    // prefix. Resume after registration so this exercises actual interruption.
    start()
    expect(interrupted).toBe(true)
    expect(owner.writes).toBe(1)
    expect(owner.renderPhaseStates.SourceRender).toEqual({
      initialized: true,
      dirty: false,
    })
    expect(owner.sourceEvents).toEqual(["start", "end"])
    owner.runRenderPhase("SourceRender")
    expect(owner.writes).toBe(1)
  }
})
