import { expect, test } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"

class StatefulRenderable extends Renderable {
  calls: string[] = []
  doInitialSourceRender() {
    this.calls.push("initial")
    this._markDirty("SourceRender")
  }
  updateSourceRender() {
    this.calls.push("update")
  }
  removeSourceRender() {
    this.calls.push("remove")
  }
}

test("unobserved compact phase state matches an eagerly inspected component through updates and removal", () => {
  const compact = new StatefulRenderable({})
  const observed = new StatefulRenderable({})
  const originalView = observed.renderPhaseStates
  for (const component of [compact, observed]) {
    component.runRenderPhase("SourceRender")
    component.runRenderPhase("SourceRender")
    component.runRenderPhase("SourceRender")
    component.shouldBeRemoved = true
    component.runRenderPhase("SourceRender")
    component.runRenderPhase("SourceRender")
    component.shouldBeRemoved = false
    component.runRenderPhase("SourceRender")
  }
  expect(compact.calls).toEqual(["initial", "update", "remove", "initial"])
  expect(compact.calls).toEqual(observed.calls)
  expect(compact.renderPhaseStates).toEqual(originalView)
  expect(observed.renderPhaseStates).toBe(originalView)
  expect(compact.renderPhaseStates.SourceRender).toEqual({
    initialized: true,
    dirty: true,
  })
  expect(compact.getRenderGraph().renderPhaseStates).toBe(
    compact.renderPhaseStates,
  )
})
