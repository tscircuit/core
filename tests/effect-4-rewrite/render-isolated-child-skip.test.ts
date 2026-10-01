import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { Renderable } from "lib/components/base-components/Renderable"
import { attachRenderChild } from "./render-helpers"

class IsolatedGroup extends Renderable {
  _isIsolatedSubcircuit = false
  doInitialRenderIsolatedSubcircuits() {}
}

test("Effect traversal reevaluates isolated-child suppression between live children", () => {
  const parent = new IsolatedGroup({})
  const first = new IsolatedGroup({})
  const second = new IsolatedGroup({})
  attachRenderChild(parent, first)
  attachRenderChild(parent, second)
  first.doInitialRenderIsolatedSubcircuits = () => {
    parent._isIsolatedSubcircuit = true
  }
  Effect.runSync(
    parent.runRenderPhaseForChildrenEffect("RenderIsolatedSubcircuits"),
  )
  expect(first.renderPhaseStates.RenderIsolatedSubcircuits.initialized).toBe(
    true,
  )
  expect(second.renderPhaseStates.RenderIsolatedSubcircuits.initialized).toBe(
    false,
  )
  parent._isIsolatedSubcircuit = false
  parent.runRenderPhaseForChildren("RenderIsolatedSubcircuits")
  expect(second.renderPhaseStates.RenderIsolatedSubcircuits.initialized).toBe(
    true,
  )
})
