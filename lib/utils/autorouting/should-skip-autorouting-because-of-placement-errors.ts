import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export const shouldSkipAutoroutingBecauseOfPlacementErrors = ({
  component,
  subcircuit,
}: {
  component: PrimitiveComponent
  subcircuit: { subcircuit_id: string | null }
}): boolean => {
  let ancestor: PrimitiveComponent | null = component
  let placementErrorCount = 0

  while (ancestor) {
    if (
      "_pcbPlacementDrcErrorCount" in ancestor &&
      typeof ancestor._pcbPlacementDrcErrorCount === "number"
    ) {
      placementErrorCount = ancestor._pcbPlacementDrcErrorCount
      break
    }
    ancestor = ancestor.parent as PrimitiveComponent | null
  }

  if (placementErrorCount === 0) return false

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
      message: `Autorouting was skipped because ${placementErrorCount} PCB placement error${placementErrorCount === 1 ? " was" : "s were"} found. Fix the placement errors or set placementDrcChecksDisabled to true to route anyway.`,
    })
  }

  return true
}
