import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getDifferentialPairPhaseSkew } from "compute-differential-pair-phase-skew"

/**
 * Replaces the stored phase skew elements with freshly computed ones. Each
 * element's id comes from its pair's source_bus_id, so a pair keeps its id
 * across renders.
 */
export function storePcbDifferentialPairPhaseSkew(
  db: CircuitJsonUtilObjects,
): void {
  for (const phaseSkew of db.pcb_differential_pair_phase_skew.list()) {
    db.pcb_differential_pair_phase_skew.delete(
      phaseSkew.pcb_differential_pair_phase_skew_id,
    )
  }
  if (!db.source_bus.list().some((bus) => bus.differential_pair)) return

  const phaseSkews = getDifferentialPairPhaseSkew({ circuitJson: db.toArray() })
  for (const phaseSkew of phaseSkews) {
    db.pcb_differential_pair_phase_skew.insert(phaseSkew)
  }
}
