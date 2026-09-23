import { expect, test } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"

class ThrowingRenderable extends Renderable {
  doInitialSourceRender() {
    throw new Error("source failed")
  }
}

test("a failed compact phase remains uninitialized with dirty state cleared", () => {
  const component = new ThrowingRenderable({})
  component._markDirty("SourceRender")
  expect(() => component.runRenderPhase("SourceRender")).toThrow(
    "source failed",
  )
  expect(component.renderPhaseStates.SourceRender).toEqual({
    initialized: false,
    dirty: false,
  })
  expect(component.renderPhaseStates.CheckRefDesConvention.dirty).toBe(true)
})
