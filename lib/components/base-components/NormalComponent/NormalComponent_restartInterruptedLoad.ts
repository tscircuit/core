import * as Effect from "effect/Effect"
import { coreSync } from "lib/effect/core-error"
import type { CoreJobContext } from "lib/effect/core-services"
import type { NormalComponent } from "./NormalComponent"

export function NormalComponent_restartInterruptedLoad(
  component: NormalComponent<any, any>,
  effectName: string,
) {
  switch (effectName) {
    case "load-footprint-url":
    case "load-lib-footprint":
    case "load-footprint-from-platform-file-parser":
      component._hasStartedFootprintUrlLoad = false
      component._markDirty("PcbFootprintStringRender")
      break
    case "load-standard-connector-circuit-json":
      component._hasStartedFootprintUrlLoad = false
      component._markDirty("FetchPartFootprint")
      break
    case "get-supplier-part-numbers":
      component._asyncSupplierPartNumbers = undefined
      component._markDirty("PartsEngineRender")
      break
    case "analyze-part-orientation":
      component._hasStartedPartOrientationAnalysis = false
      component._asyncSupplierPin1LocationMap = undefined
      component._markDirty("PartOrientationAnalysis")
      break
    case "check-supplier-footprint-mismatch":
      component._hasStartedSupplierFootprintMismatchWarningCheck = false
      component._markDirty("SupplierFootprintMismatchWarning")
      break
  }
}

/** Reset only this pending generation, at the synchronous abort notification. */
export function NormalComponent_withInterruptedLoadRestart<A, E, R>(
  component: NormalComponent<any, any>,
  effectName: string,
  job: CoreJobContext,
  program: Effect.Effect<A, E, R>,
) {
  return Effect.acquireUseRelease(
    coreSync(() => {
      const restart = () =>
        NormalComponent_restartInterruptedLoad(component, effectName)
      job.signal.addEventListener("abort", restart, { once: true })
      if (job.signal.aborted) restart()
      return () => job.signal.removeEventListener("abort", restart)
    }, "own_interrupted_load_restart"),
    () => program,
    (release) =>
      coreSync(release, "release_interrupted_load_restart").pipe(Effect.orDie),
  )
}
