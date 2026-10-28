import { expect, test } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"
import { type RenderPhaseStates } from "../../../lib/components/base-components/render-phases"

class ReplacingRenderable extends Renderable {
  capturedState?: RenderPhaseStates["SourceRender"]

  doInitialSourceRender() {
    this.capturedState = this.renderPhaseStates.SourceRender
    this.renderPhaseStates.SourceRender = { initialized: false, dirty: true }
  }
}

test("first inspection inside a handler exposes the same state object the phase completes", () => {
  const component = new ReplacingRenderable({})
  component.runRenderPhase("SourceRender")
  expect(component.capturedState).toEqual({ initialized: true, dirty: false })
  expect(component.renderPhaseStates.SourceRender).toEqual({
    initialized: false,
    dirty: true,
  })
})
