import { expect, test } from "bun:test"
import {
  PhaseLifecycleProbe,
  observePhaseHook,
  observePhaseState,
} from "./phase-lifecycle-probe"

test("supplementary: lifecycle and hook failures preserve identity and stop later phase work", () => {
  const failures = [new Error("phase sentinel"), "phase sentinel", undefined, {}]
  for (const failure of failures) {
    for (const action of ["initial", "update", "remove"] as const) {
      for (const failurePoint of [
        "start",
        "hook_lookup",
        "hook",
        "end",
      ] as const) {
        const probe = new PhaseLifecycleProbe({})
        const state = observePhaseState(probe, "SourceRender", {
          initialized: action !== "initial",
          dirty: true,
        })
        probe.shouldBeRemoved = action === "remove"
        probe.onLifecycle = (event) => {
          if (event === failurePoint) throw failure
        }
        observePhaseHook(probe, "SourceRender", action, {
          onRead: () => {
            if (failurePoint === "hook_lookup") throw failure
          },
          onHook: () => {
            if (failurePoint === "hook") throw failure
          },
        })

        let didThrow = false
        let thrown: unknown
        try {
          probe.runRenderPhase("SourceRender")
        } catch (error) {
          didThrow = true
          thrown = error
        }
        expect(didThrow).toBe(true)
        expect(thrown).toBe(failure)

        const completeEvents = {
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
        }[action]
        expect({ action, failurePoint, events: probe.events }).toEqual({
          action,
          failurePoint,
          events: completeEvents.slice(
            0,
            completeEvents.indexOf(failurePoint) + 1,
          ),
        })
        expect(state).toEqual({
          initialized:
            failurePoint === "end" ? action !== "remove" : action !== "initial",
          dirty:
            failurePoint === "end"
              ? false
              : action !== "initial" || failurePoint === "start",
        })
      }
    }
  }
})
