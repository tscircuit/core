import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"

class SubscribingRenderable extends Renderable {
  root = new RootCircuit()
  events: string[] = []
  displayNameCalls = 0
  getString() {
    this.displayNameCalls++
    return "subscribing"
  }
  listener = (event: { type: string }) => this.events.push(event.type)
  doInitialSourceRender() {
    this.root.on("renderable:renderLifecycle:anyEvent", this.listener)
  }
}

test("lifecycle subscriptions added within a phase and removed during delivery remain live", () => {
  const component = new SubscribingRenderable({})
  component.runRenderPhase("SourceRender")
  expect(component.events).toEqual([
    "renderable:renderLifecycle:SourceRender:end",
  ])
  component.root.removeListener(
    "renderable:renderLifecycle:anyEvent",
    component.listener,
  )
  const start = "renderable:renderLifecycle:CheckRefDesConvention:start"
  const remove = () => component.root.removeListener(start, remove)
  component.root.on(start, remove)
  component.runRenderPhase("CheckRefDesConvention")
  const callsAfterRemoval = component.displayNameCalls
  component.runRenderPhase("CheckRefDesConvention")
  expect(component.displayNameCalls).toBe(callsAfterRemoval)
  component.root.on("renderable:renderLifecycle:anyEvent", component.listener)
  component.root.on(start, remove)
  component.root.removeListener(start, remove)
  component.runRenderPhase("CheckRefDesConvention")
  expect(component.events.slice(1)).toEqual([
    "renderable:renderLifecycle:CheckRefDesConvention:start",
    "renderable:renderLifecycle:CheckRefDesConvention:end",
  ])
})
