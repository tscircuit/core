import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import {
  type RenderPhaseStates,
  Renderable,
} from "lib/components/base-components/Renderable"
import { orderedRenderPhases } from "lib/effect/render-phase-definitions"

class ReplacedStateRenderable extends Renderable {
  captured?: RenderPhaseStates["SourceRender"]
  replacement = { initialized: false, dirty: true }
  doInitialSourceRender() {
    this.captured = this.renderPhaseStates.SourceRender
    this.renderPhaseStates.SourceRender = this.replacement
  }
}

test("Effect phases read replacement maps at execution but complete the entry captured before the hook", () => {
  const renderable = new ReplacedStateRenderable({})
  const program = renderable.runRenderPhaseEffect("SourceRender")
  const replacementStates = Object.fromEntries(
    orderedRenderPhases.map((phase) => [
      phase,
      { initialized: false, dirty: true },
    ]),
  ) as RenderPhaseStates
  renderable.renderPhaseStates = replacementStates
  Effect.runSync(program)
  expect(renderable.renderPhaseStates).toBe(replacementStates)
  expect(renderable.captured).toEqual({ initialized: true, dirty: false })
  expect(renderable.renderPhaseStates.SourceRender).toBe(renderable.replacement)
  expect(renderable.replacement).toEqual({ initialized: false, dirty: true })
})
