import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getDifferentialPairPhaseSkew } from "circuit-json-to-differential-pair-phase-skew"

/** Saves one phase skew element per measurable pair and removes stale elements. */
export function storePcbDifferentialPairPhaseSkew(
  db: CircuitJsonUtilObjects,
): void {
  const phaseSkewTable = db.pcb_differential_pair_phase_skew
  const stalePhaseSkewIds = new Set(
    phaseSkewTable
      .list()
      .map((phaseSkew) => phaseSkew.pcb_differential_pair_phase_skew_id),
  )
  if (
    stalePhaseSkewIds.size === 0 &&
    !db.source_bus.list().some((bus) => bus.differential_pair)
  ) {
    return
  }

  const phaseSkews = getDifferentialPairPhaseSkew({ circuitJson: db.toArray() })
  for (const phaseSkew of phaseSkews) {
    const { pcb_differential_pair_phase_skew_id } = phaseSkew
    if (stalePhaseSkewIds.delete(pcb_differential_pair_phase_skew_id)) {
      phaseSkewTable.update(pcb_differential_pair_phase_skew_id, phaseSkew)
      continue
    }
    phaseSkewTable.insert(phaseSkew)
  }
  for (const pcb_differential_pair_phase_skew_id of stalePhaseSkewIds) {
    phaseSkewTable.delete(pcb_differential_pair_phase_skew_id)
  }
}
