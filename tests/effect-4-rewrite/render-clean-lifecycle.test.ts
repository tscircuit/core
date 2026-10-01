import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { RootCircuit } from "lib/RootCircuit"
import { Renderable } from "lib/components/base-components/Renderable"

class ObservedCleanActor extends Renderable {
  constructor(readonly root: RootCircuit) {
    super({})
  }
}

test("clean phases retain listeners registered after program creation and during lifecycle start", async () => {
  const circuit = new RootCircuit()
  const actor = new ObservedCleanActor(circuit)
  const events: string[] = []
  let hookReads = 0
  let updates = 0
  Object.defineProperty(actor, "updateSourceRender", {
    get: () => {
      hookReads++
      return () => updates++
    },
  })
  const program = actor.runRenderPhaseEffect("SourceRender")
  actor.renderPhaseStates.SourceRender = { initialized: true, dirty: false }
  circuit.on("renderable:renderLifecycle:SourceRender:start", () => {
    expect(actor.getCurrentRenderPhase()).toBe("SourceRender")
    events.push("start")
    actor.renderPhaseStates.SourceRender.dirty = true
    circuit.on("renderable:renderLifecycle:SourceRender:end", () => {
      events.push("end")
    })
  })
  Effect.runSync(program)
  expect(events).toEqual(["start", "end"])
  expect(hookReads).toBe(0)
  expect(updates).toBe(0)
  expect(actor.renderPhaseStates.SourceRender).toEqual({
    initialized: true,
    dirty: true,
  })
  actor.runRenderPhase("SourceRender")
  expect(hookReads).toBe(1)
  expect(updates).toBe(1)
  expect(actor.renderPhaseStates.SourceRender.dirty).toBe(false)
  await circuit.dispose()
})
