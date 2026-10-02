import { expect, test } from "bun:test"
import {
  Renderable,
  type RenderPhase,
  type RenderPhaseStates,
} from "lib/components/base-components/Renderable"

class PhaseStateProbe extends Renderable {
  phaseMapReads = 0

  override get renderPhaseStates(): RenderPhaseStates {
    this.phaseMapReads++
    return super.renderPhaseStates
  }

  override set renderPhaseStates(states: RenderPhaseStates) {
    super.renderPhaseStates = states
  }

  isPhaseInitialized(phase: RenderPhase) {
    return this._isRenderPhaseInitialized(phase)
  }
}

test("phase initialization queries stay lazy and honor inspected or replaced state", () => {
  const component = new PhaseStateProbe({})
  expect(component.isPhaseInitialized("SourceRender")).toBe(false)

  component.runRenderPhase("SourceRender")
  expect(component.isPhaseInitialized("SourceRender")).toBe(true)
  component._markDirty("SourceRender")
  expect(component.isPhaseInitialized("SourceRender")).toBe(true)

  component.shouldBeRemoved = true
  component.runRenderPhase("SourceRender")
  expect(component.isPhaseInitialized("SourceRender")).toBe(false)
  expect(component.phaseMapReads).toBe(0)

  const states = component.renderPhaseStates
  states.SourceRender = { initialized: true, dirty: false }
  expect(component.isPhaseInitialized("SourceRender")).toBe(true)
  states.SourceRender.initialized = false
  expect(component.isPhaseInitialized("SourceRender")).toBe(false)

  component.renderPhaseStates = {
    ...states,
    SourceRender: { initialized: true, dirty: false },
  }
  expect(component.isPhaseInitialized("SourceRender")).toBe(true)
  expect(component.isPhaseInitialized("PcbPortRender")).toBe(false)
  expect(component.phaseMapReads).toBe(1)
})
