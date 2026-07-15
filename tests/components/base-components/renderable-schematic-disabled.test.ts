import { expect, test } from "bun:test"
import type { IRootCircuit } from "lib/IRootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"

class TestRenderable extends Renderable {
  root = {
    schematicDisabled: true,
    emit: () => {},
  } as unknown as IRootCircuit
  sourceRenderCount = 0
  schematicRenderCount = 0

  constructor() {
    super({})
  }

  doInitialSourceRender() {
    this.sourceRenderCount++
  }

  doInitialSchematicComponentRender() {
    this.schematicRenderCount++
  }
}

test("Renderable skips schematic phases when schematicDisabled is enabled", () => {
  const parent = new TestRenderable()
  const child = new TestRenderable()
  parent.children.push(child)

  parent.runRenderPhaseForChildren("SourceRender")
  parent.runRenderPhase("SourceRender")
  parent.runRenderPhaseForChildren("SchematicComponentRender")
  parent.runRenderPhase("SchematicComponentRender")

  expect(parent.sourceRenderCount).toBe(1)
  expect(child.sourceRenderCount).toBe(1)
  expect(parent.schematicRenderCount).toBe(0)
  expect(child.schematicRenderCount).toBe(0)
  expect(parent.renderPhaseStates.SchematicComponentRender.initialized).toBe(
    false,
  )
  expect(child.renderPhaseStates.SchematicComponentRender.initialized).toBe(
    false,
  )
})
