import type { SpiceEngine } from "@tscircuit/props"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { corePromise } from "./core-error"

export class SpiceSimulationEngine extends Context.Service<
  SpiceSimulationEngine,
  SpiceEngine
>()("tscircuit/SpiceSimulationEngine") {}

/**
 * Installed SpiceEngine only supports simulate(string), with no signal or
 * session disposer. Cancellation interrupts this await; guarded job commits
 * suppress late results without closing a platform engine shared by other jobs.
 */
export function simulateSpiceEffect(spiceString: string) {
  return Effect.gen(function* () {
    const engine = yield* SpiceSimulationEngine
    return yield* corePromise(
      () => engine.simulate(spiceString),
      "simulation:spice",
    )
  })
}
