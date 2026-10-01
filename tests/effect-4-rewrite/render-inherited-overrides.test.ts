import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import {
  type RenderPhase,
  Renderable,
} from "lib/components/base-components/Renderable"
import { coreSync } from "lib/effect/core-error"
import { attachRenderChild } from "./render-helpers"

class NativeIntermediate extends Renderable {
  entries: string[] = []
  override runRenderPhaseEffect(phase: RenderPhase) {
    return Effect.andThen(
      coreSync(() => {
        this.entries.push("native_phase")
      }),
      super.runRenderPhaseEffect(phase),
    )
  }
  override runRenderPhaseForChildrenEffect(phase: RenderPhase) {
    return Effect.andThen(
      coreSync(() => {
        this.entries.push("native_children")
      }),
      super.runRenderPhaseForChildrenEffect(phase),
    )
  }
  override _markDirtyEffect(phase: RenderPhase) {
    return Effect.andThen(
      coreSync(() => {
        this.entries.push("native_dirty")
      }),
      super._markDirtyEffect(phase),
    )
  }
}

class LegacySubclass extends NativeIntermediate {
  override runRenderPhase(phase: RenderPhase) {
    this.entries.push("legacy_phase")
    super.runRenderPhase(phase)
  }
  override runRenderPhaseForChildren(phase: RenderPhase) {
    this.entries.push("legacy_children")
    super.runRenderPhaseForChildren(phase)
  }
  override _markDirty(phase: RenderPhase) {
    this.entries.push("legacy_dirty")
    super._markDirty(phase)
  }
}

class OrdinaryRenderable extends Renderable {}

test("nearer synchronous subclass overrides retain precedence over inherited native phase, child and dirty hooks", () => {
  const parent = new OrdinaryRenderable({})
  const extension = new LegacySubclass({})
  const nested = new OrdinaryRenderable({})
  attachRenderChild(parent, extension)
  attachRenderChild(extension, nested)
  let legacyMethodReads = 0
  Object.defineProperty(extension, "runRenderPhaseForChildren", {
    get: () => {
      legacyMethodReads++
      return LegacySubclass.prototype.runRenderPhaseForChildren
    },
  })
  Effect.runSync(parent.runRenderPhaseForChildrenEffect("SourceRender"))
  expect(legacyMethodReads).toBe(1)
  expect(extension.entries).toEqual([
    "legacy_children",
    "native_children",
    "legacy_phase",
    "native_phase",
  ])
  extension.entries.length = 0
  Effect.runSync(nested._markDirtyEffect("SourceRender"))
  expect(extension.entries).toEqual(["legacy_dirty", "native_dirty"])
  expect(extension.renderPhaseStates.SourceRender).toEqual({
    initialized: true,
    dirty: true,
  })
  expect(parent.renderPhaseStates.SourceRender.dirty).toBe(true)
})
