import type { PreflightRoutingCheckPolicy } from "@tscircuit/props"
import { resolvePreflightRoutingCheckPolicy } from "./resolve-preflight-routing-check-policy"
import { insertPcbPreflightRoutingError } from "./insert-pcb-preflight-routing-error"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export const shouldSkipAutoroutingBecauseOfPlacementErrors = ({
  component,
  subcircuit,
  policy,
  deferBlocking = false,
  routingPhaseIndex,
  phaseName,
}: {
  component: PrimitiveComponent
  subcircuit: { subcircuit_id: string | null }
  policy?: PreflightRoutingCheckPolicy
  deferBlocking?: boolean
  routingPhaseIndex?: number
  phaseName?: string
}): boolean => {
  component._pcbTraceRenderWaitingForPlacementChecks = false
  const resolvedPolicy = resolvePreflightRoutingCheckPolicy(component, policy)
  if (resolvedPolicy === "none") return false
  let ancestor: PrimitiveComponent | null = component
  let placementErrorCount = 0
  let placementCheckError: string | null = null
  let placementChecksPending = false

  while (ancestor) {
    if ("_pcbPlacementDrcErrorCount" in ancestor) {
      if (
        "_pcbPlacementDrcChecksPending" in ancestor &&
        ancestor._pcbPlacementDrcChecksPending === true
      ) {
        placementChecksPending = true
        break
      }
      if (typeof ancestor._pcbPlacementDrcErrorCount === "number") {
        placementErrorCount = ancestor._pcbPlacementDrcErrorCount
        break
      }
      if (
        "_pcbPlacementDrcCheckError" in ancestor &&
        typeof ancestor._pcbPlacementDrcCheckError === "string"
      ) {
        placementCheckError = ancestor._pcbPlacementDrcCheckError
        break
      }
    }
    ancestor = ancestor.parent as PrimitiveComponent | null
  }

  if (placementChecksPending) {
    component._pcbTraceRenderWaitingForPlacementChecks = true
    return true
  }
  if (deferBlocking) return false
  if (placementErrorCount === 0 && !placementCheckError) return false

  if (resolvedPolicy !== undefined) {
    insertPcbPreflightRoutingError(component, {
      error_code: placementCheckError
        ? "placement_check_failed"
        : "placement_errors",
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      routing_phase_index: routingPhaseIndex,
      phase_name: phaseName,
      message: placementCheckError
        ? `Routing preflight could not complete placement checks: ${placementCheckError}`
        : `Routing preflight blocked this phase because ${placementErrorCount} PCB placement errors were found. Fix placement or set preflightRoutingCheckPolicy="none" to attempt routing anyway.`,
      measurements: { placement_error_count: placementErrorCount },
    })
    return true
  }

  const { db } = component.root!
  const pcbErrorId = `pcb_autorouting_skipped_placement_errors_${subcircuit.subcircuit_id}`
  const errorAlreadyExists = db.pcb_autorouting_error
    .list()
    .some((error) => error.pcb_error_id === pcbErrorId)

  if (!errorAlreadyExists) {
    db.pcb_autorouting_error.insert({
      pcb_error_id: pcbErrorId,
      error_type: "pcb_autorouting_error",
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      message: placementCheckError
        ? `Autorouting was skipped because PCB placement checks could not be completed: ${placementCheckError}`
        : `Autorouting was skipped because ${placementErrorCount} PCB placement error${placementErrorCount === 1 ? " was" : "s were"} found. Fix the placement errors or set placementDrcChecksDisabled to true to route anyway.`,
    })
  }

  return true
}
