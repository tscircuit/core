import { expect, test } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"

class DelayedFootprint extends Renderable {
  release!: () => void
  doInitialFetchPartFootprint() {
    this._queueAsyncEffect(
      "footprint",
      () =>
        new Promise<void>((resolve) => {
          this.release = resolve
        }),
    )
  }
}
class ParentRenderable extends Renderable {
  calls = 0
  doInitialSchematicLayout() {
    this.calls++
  }
}

test("unobserved compact phases wait for descendant async dependencies and propagate dirtiness", async () => {
  const parent = new ParentRenderable({})
  const child = new DelayedFootprint({})
  parent.children.push(child)
  child.parent = parent
  child.runRenderPhase("FetchPartFootprint")
  parent.runRenderPhase("SchematicLayout")
  expect(parent.calls).toBe(0)
  child.release()
  await Promise.resolve()
  parent.runRenderPhase("SchematicLayout")
  expect(parent.calls).toBe(1)
  child._markDirty("SchematicLayout")
  expect(parent.renderPhaseStates.SchematicLayout).toEqual({
    initialized: true,
    dirty: true,
  })
  expect(child.renderPhaseStates.SchematicLayout).toEqual({
    initialized: false,
    dirty: true,
  })
})
