import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"

class ObservedRenderable extends Renderable {
  root = new RootCircuit()
  displayNameCalls = 0
  getString() {
    this.displayNameCalls++
    return "observed-renderable"
  }
  emitLifecycle() {
    this._emitRenderLifecycleEvent("SourceRender", "start")
  }
}

test("unobserved lifecycle events avoid formatting but subscriptions remain live", () => {
  const component = new ObservedRenderable({})
  for (let i = 0; i < 1000; i++) component.emitLifecycle()
  expect(component.displayNameCalls).toBe(0)

  const events: unknown[] = []
  const listener = (event: unknown) => events.push(event)
  const phaseEvent = "renderable:renderLifecycle:SourceRender:start"
  component.root.on(phaseEvent, listener)
  component.emitLifecycle()
  expect(events).toEqual([
    {
      type: phaseEvent,
      renderId: component._renderId,
      componentDisplayName: "observed-renderable",
    },
  ])
  component.root.removeListener(phaseEvent, listener)
  component.emitLifecycle()
  expect(component.displayNameCalls).toBe(1)

  component.root.on("renderable:renderLifecycle:anyEvent", listener)
  component.emitLifecycle()
  expect(events).toHaveLength(2)
  expect(component.displayNameCalls).toBe(2)
})
