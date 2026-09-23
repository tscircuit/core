import { expect, test } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"

class AsyncRenderable extends Renderable {
  release!: () => void
  calls: string[] = []
  doInitialSourceRender() {
    this._queueAsyncEffect(
      "source",
      () =>
        new Promise<void>((resolve) => {
          this.release = resolve
        }),
    )
  }
  doInitialCheckRefDesConvention() {
    this.calls.push("next")
  }
}

test("compact phases respect pending async effects before initialization", async () => {
  const component = new AsyncRenderable({})
  component.runRenderPhase("SourceRender")
  component.runRenderPhase("CheckRefDesConvention")
  expect(component.calls).toEqual([])
  expect(component.renderPhaseStates.CheckRefDesConvention.initialized).toBe(
    false,
  )
  component.release()
  await Promise.resolve()
  component.runRenderPhase("CheckRefDesConvention")
  expect(component.calls).toEqual(["next"])
  expect(component.renderPhaseStates.CheckRefDesConvention.initialized).toBe(
    true,
  )
})
