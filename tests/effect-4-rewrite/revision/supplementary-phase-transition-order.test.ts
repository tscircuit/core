import { expect, test } from "bun:test"
import { orderedRenderPhases } from "lib/components/base-components/Renderable"
import {
  PhaseLifecycleProbe,
  observePhaseHook,
  observePhaseState,
} from "./phase-lifecycle-probe"

test("supplementary: all phases keep lifecycle, hook lookup and state-write order", () => {
  for (const phase of orderedRenderPhases) {
    for (const action of ["initial", "update", "remove", "clean"] as const) {
      const probe = new PhaseLifecycleProbe({})
      const state = observePhaseState(probe, phase, {
        initialized: action !== "initial",
        dirty: action !== "clean",
      })
      probe.shouldBeRemoved = action === "remove"
      observePhaseHook(probe, phase, action === "clean" ? "update" : action)

      probe.runRenderPhase(phase)

      const expectedEvents = {
        initial: [
          "start",
          "dirty:false",
          "hook_lookup",
          "hook",
          "initialized:true",
          "end",
        ],
        update: ["start", "hook_lookup", "hook", "dirty:false", "end"],
        remove: [
          "start",
          "hook_lookup",
          "hook",
          "initialized:false",
          "dirty:false",
          "end",
        ],
        clean: ["start", "end"],
      }
      expect({ phase, action, events: probe.events }).toEqual({
        phase,
        action,
        events: expectedEvents[action],
      })
      expect(state).toEqual({
        initialized: action !== "remove",
        dirty: false,
      })
      expect(probe.getCurrentRenderPhase()).toBe(phase)
    }

    const removed = new PhaseLifecycleProbe({})
    observePhaseState(removed, phase, { initialized: false, dirty: true })
    observePhaseHook(removed, phase, "remove")
    removed.shouldBeRemoved = true
    removed.runRenderPhase(phase)
    expect({ phase, events: removed.events }).toEqual({ phase, events: [] })
  }
})
