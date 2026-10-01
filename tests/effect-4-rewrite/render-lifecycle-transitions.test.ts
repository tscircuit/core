import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { orderedRenderPhases } from "lib/effect/render-phase-definitions"
import { RenderLedger, attachRenderChild } from "./render-helpers"

test("all Effect phase states transition through initialization, dirty updates, removal and reinitialization", () => {
  const ledger: string[] = []
  const parent = new RenderLedger({ name: "parent", ledger })
  const child = new RenderLedger({ name: "child", ledger })
  attachRenderChild(parent, child)
  const observedStates = child.renderPhaseStates
  parent.runRenderCycle()
  ledger.length = 0
  const dirtyProgram = child._markDirtyEffect("SourceRender")
  expect(parent.renderPhaseStates.SourceRender.dirty).toBe(false)
  Effect.runSync(dirtyProgram)
  const sourcePhaseIndex = orderedRenderPhases.indexOf("SourceRender")
  for (const [phaseIndex, phase] of orderedRenderPhases.entries()) {
    expect(child.renderPhaseStates[phase].dirty).toBe(
      phaseIndex >= sourcePhaseIndex,
    )
    expect(parent.renderPhaseStates[phase].dirty).toBe(
      phaseIndex >= sourcePhaseIndex,
    )
  }
  parent.runRenderCycle()
  expect(ledger.filter((entry) => entry.startsWith("update:"))).toEqual(
    orderedRenderPhases
      .slice(sourcePhaseIndex)
      .flatMap((phase) => [`update:${phase}:child`, `update:${phase}:parent`]),
  )
  parent.shouldBeRemoved = true
  child.shouldBeRemoved = true
  ledger.length = 0
  Effect.runSync(parent.runRenderCycleEffect())
  expect(ledger.filter((entry) => entry.startsWith("remove:"))).toEqual(
    orderedRenderPhases.flatMap((phase) => [
      `remove:${phase}:child`,
      `remove:${phase}:parent`,
    ]),
  )
  expect(child.renderPhaseStates).toBe(observedStates)
  expect(
    Object.values(observedStates).every(
      (state) => !state.initialized && !state.dirty,
    ),
  ).toBe(true)
  ledger.length = 0
  parent.runRenderCycle()
  expect(ledger).toEqual([])
  parent.shouldBeRemoved = false
  child.shouldBeRemoved = false
  parent.runRenderCycle()
  expect(ledger.filter((entry) => entry.startsWith("doInitial:"))).toHaveLength(
    138,
  )
})
