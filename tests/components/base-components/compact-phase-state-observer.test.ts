import { expect, test } from "bun:test"
import {
  Renderable,
  type RenderPhaseStates,
} from "lib/components/base-components/Renderable"

class InspectedRenderable extends Renderable {
  view?: RenderPhaseStates
  calls: string[] = []
  doInitialSourceRender() {
    this.calls.push("initial")
    this.view = this.renderPhaseStates
    expect(this.view.SourceRender).toEqual({ initialized: false, dirty: false })
    this._markDirty("SourceRender")
  }
  updateSourceRender() {
    this.calls.push("update")
  }
}

test("phase state first inspected inside a handler stays live and supports direct mutations", () => {
  const component = new InspectedRenderable({})
  const other = new InspectedRenderable({})
  component.runRenderPhase("SourceRender")
  expect(component.view!.SourceRender).toEqual({
    initialized: true,
    dirty: true,
  })
  component.runRenderPhase("SourceRender")
  expect(component.view!.SourceRender).toEqual({
    initialized: true,
    dirty: false,
  })
  component.view!.SourceRender.initialized = false
  component.runRenderPhase("SourceRender")
  component.renderPhaseStates = {
    ...component.view!,
    SourceRender: { initialized: true, dirty: true },
  }
  component.runRenderPhase("SourceRender")
  expect(component.calls).toEqual(["initial", "update", "initial", "update"])
  expect(component.renderPhaseStates.SourceRender).toEqual({
    initialized: true,
    dirty: false,
  })
  expect(other.renderPhaseStates.SourceRender).toEqual({
    initialized: false,
    dirty: false,
  })
})
