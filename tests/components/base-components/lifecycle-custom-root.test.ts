import { expect, test } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"
import type { IRootCircuit } from "lib/IRootCircuit"

class CustomRootRenderable extends Renderable {
  events: string[] = []
  root: IRootCircuit = {
    emit: (event) => this.events.push(event),
    on: () => {},
    isDoneRendering: () => true,
    _hasIncompleteAsyncEffectsForPhase: () => false,
  }
}

test("custom roots without listener inspection continue receiving lifecycle events", () => {
  const component = new CustomRootRenderable({})
  component.runRenderPhase("SourceRender")
  expect(component.events).toEqual([
    "renderable:renderLifecycle:SourceRender:start",
    "renderable:renderLifecycle:anyEvent",
    "renderable:renderLifecycle:SourceRender:end",
    "renderable:renderLifecycle:anyEvent",
  ])
})
