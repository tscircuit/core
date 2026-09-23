import { expect, test } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"

class ReplacingRenderable extends Renderable {
  doInitialSourceRender() {
    this.renderPhaseStates.SourceRender = { initialized: false, dirty: true }
  }
}

test("a phase completes the observed state captured on entry when a handler replaces its public entry", () => {
  const component = new ReplacingRenderable({})
  const observedState = component.renderPhaseStates.SourceRender
  component.runRenderPhase("SourceRender")
  expect(observedState).toEqual({ initialized: true, dirty: false })
  expect(component.renderPhaseStates.SourceRender).toEqual({
    initialized: false,
    dirty: true,
  })
})
