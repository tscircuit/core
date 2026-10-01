import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import {
  type RenderPhase,
  Renderable,
} from "lib/components/base-components/Renderable"
import { runCoreSync } from "lib/effect/core-error"

class CleanPhaseActor extends Renderable {
  readonly ledger: string[] = []
  mutateAtGate = true
  blockDependency: RenderPhase | undefined
  failure: unknown
  failAtGate = false
  readonly replacement = { initialized: true, dirty: true }

  override _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase) {
    this.ledger.push(`gate:${phase}:${this._currentRenderPhase}`)
    if (this.failAtGate) throw this.failure
    if (this.mutateAtGate) {
      this.mutateAtGate = false
      this.renderPhaseStates.PcbTraceRender.dirty = true
      this.renderPhaseStates.PcbTraceRender = this.replacement
    }
    return this.blockDependency === phase
  }

  protected override _emitRenderLifecycleEvent(
    phase: RenderPhase,
    boundary: "start" | "end",
  ) {
    this.ledger.push(`${boundary}:${phase}`)
  }
}

test("clean phase decisions retain lazy captured state, gate order, event overrides and original failures", () => {
  const actor = new CleanPhaseActor({})
  let hookReads = 0
  let updates = 0
  Object.defineProperty(actor, "updatePcbTraceRender", {
    get: () => {
      hookReads++
      return () => updates++
    },
  })
  const program = actor.runRenderPhaseEffect("PcbTraceRender")
  const captured = { initialized: true, dirty: false }
  actor.renderPhaseStates.PcbTraceRender = captured
  Effect.runSync(program)
  expect(actor.ledger).toEqual([
    "gate:PcbFootprintStringRender:PcbTraceRender",
    "gate:FetchPartFootprint:PcbTraceRender",
    "start:PcbTraceRender",
    "end:PcbTraceRender",
  ])
  expect(captured).toEqual({ initialized: true, dirty: true })
  expect(actor.renderPhaseStates.PcbTraceRender).toBe(actor.replacement)
  expect(hookReads).toBe(0)
  expect(updates).toBe(0)

  actor.ledger.length = 0
  actor.runRenderPhase("PcbTraceRender")
  expect(hookReads).toBe(1)
  expect(updates).toBe(1)
  expect(actor.replacement.dirty).toBe(false)
  actor.blockDependency = "FetchPartFootprint"
  actor.ledger.length = 0
  actor.runRenderPhase("PcbTraceRender")
  expect(actor.ledger).toEqual([
    "gate:PcbFootprintStringRender:PcbTraceRender",
    "gate:FetchPartFootprint:PcbTraceRender",
  ])
  expect(hookReads).toBe(1)

  const failure = { sentinel: "clean dependency" }
  actor.failure = failure
  actor.failAtGate = true
  let didThrow = false
  try {
    runCoreSync(actor.runRenderPhaseEffect("PcbTraceRender"))
  } catch (error) {
    didThrow = true
    expect(error).toBe(failure)
  }
  expect(didThrow).toBe(true)
  expect(actor._currentRenderPhase).toBe("PcbTraceRender")
})
