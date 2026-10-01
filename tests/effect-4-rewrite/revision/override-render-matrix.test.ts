import { expect, test } from "bun:test"
import { runCoreSync } from "lib/effect/core-error"
import {
  RenderOverrideBase,
  attachRenderOverride,
  renderOverrideCases,
  type RenderOverrideFamily,
} from "./override-render-fixture"

test("public render extensions retain the current nearest and sync-identity dispatch matrices", () => {
  const families: RenderOverrideFamily[] = [
    "phase", "children", "dirty", "incomplete", "incomplete_phase",
  ]
  for (const family of families) {
    for (const fixture of renderOverrideCases) {
      const actor = fixture.create()
      const wrapper = new RenderOverrideBase()
      if (family === "dirty") {
        attachRenderOverride(actor, wrapper)
        runCoreSync(wrapper._markDirtyEffect("SourceRender"))
        expect(actor.renderPhaseStates.SourceRender.dirty).toBe(true)
      } else {
        attachRenderOverride(wrapper, actor)
        if (family === "phase" || family === "children") {
          runCoreSync(wrapper.runRenderPhaseForChildrenEffect("SourceRender"))
        } else if (family === "incomplete") {
          expect(runCoreSync(wrapper._hasIncompleteAsyncEffectsEffect())).toBe(false)
        } else {
          expect(runCoreSync(wrapper._hasIncompleteAsyncEffectsInSubtreeForPhaseEffect("SourceRender"))).toBe(false)
        }
      }
      const policy = family === "incomplete" || family === "incomplete_phase"
        ? fixture.identity
        : fixture.nearest
      expect({ family, name: fixture.name, calls: actor.calls.filter((call) => call.startsWith(`${family}:`)) }).toEqual({
        family,
        name: fixture.name,
        calls: policy.map((implementation) => `${family}:${implementation}`),
      })
    }
  }

  const methods = [
    ["phase", "runRenderPhase"],
    ["children", "runRenderPhaseForChildren"],
    ["dirty", "_markDirty"],
    ["incomplete", "_hasIncompleteAsyncEffects"],
    ["incomplete_phase", "_hasIncompleteAsyncEffectsInSubtreeForPhase"],
  ] as const
  for (const [family, method] of methods) {
    const actor = new RenderOverrideBase()
    const wrapper = new RenderOverrideBase()
    const original = Object.freeze({ family, method })
    let calls = 0
    Object.defineProperty(actor, method, { value: () => { calls++; throw original } })
    if (family === "dirty") attachRenderOverride(actor, wrapper)
    else attachRenderOverride(wrapper, actor)
    let thrown: unknown
    try {
      if (family === "dirty") runCoreSync(wrapper._markDirtyEffect("SourceRender"))
      else if (family === "incomplete") runCoreSync(wrapper._hasIncompleteAsyncEffectsEffect())
      else if (family === "incomplete_phase") runCoreSync(wrapper._hasIncompleteAsyncEffectsInSubtreeForPhaseEffect("SourceRender"))
      else runCoreSync(wrapper.runRenderPhaseForChildrenEffect("SourceRender"))
    } catch (error) { thrown = error }
    expect(thrown).toBe(original)
    expect(calls).toBe(1)
  }
})
