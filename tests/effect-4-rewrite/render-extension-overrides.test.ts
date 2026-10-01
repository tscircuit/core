import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import {
  type RenderPhase,
  Renderable,
} from "lib/components/base-components/Renderable"
import { coreSync } from "lib/effect/core-error"
import { orderedRenderPhases } from "lib/effect/render-phase-definitions"
import { attachRenderChild } from "./render-helpers"

class SynchronousExtension extends Renderable {
  events: string[] = []
  override runRenderPhase(phase: RenderPhase) {
    this.events.push(`phase:${phase}`)
    super.runRenderPhase(phase)
  }
  override runRenderPhaseForChildren(phase: RenderPhase) {
    this.events.push(`children:${phase}`)
    super.runRenderPhaseForChildren(phase)
  }
}

class NativeExtension extends Renderable {
  events: string[] = []
  override runRenderPhase() {
    throw new Error("Effect traversal must select the native phase override")
  }
  override runRenderPhaseEffect(phase: RenderPhase) {
    return Effect.andThen(
      coreSync(() => {
        this.events.push(`native:${phase}`)
      }),
      super.runRenderPhaseEffect(phase),
    )
  }
}

test("Effect traversal preserves synchronous extensions and dispatches explicit native overrides", () => {
  const parent = new SynchronousExtension({})
  const child = new SynchronousExtension({})
  const native = new NativeExtension({})
  attachRenderChild(parent, child)
  attachRenderChild(parent, native)
  Effect.runSync(parent.runRenderCycleEffect())
  const extensionEvents = orderedRenderPhases.flatMap((phase) => [
    `children:${phase}`,
    `phase:${phase}`,
  ])
  expect(parent.events).toEqual(extensionEvents)
  expect(child.events).toEqual(extensionEvents)
  expect(native.events).toEqual(
    orderedRenderPhases.map((phase) => `native:${phase}`),
  )
})
