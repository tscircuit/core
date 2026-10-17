import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbCopperPour, SourceNet } from "circuit-json"
import type { CopperPour } from "./CopperPour"
import { markTraceSegmentsInsideCopperPour } from "./utils/mark-trace-segments-inside-copper-pour"

export const preserveExplicitZeroClearanceCopperPour = ({
  copperPour,
  db,
  sourceNetId,
  subcircuitId,
}: {
  copperPour: CopperPour
  db: CircuitJsonUtilObjects
  sourceNetId: SourceNet["source_net_id"]
  subcircuitId?: PcbCopperPour["subcircuit_id"]
}): boolean => {
  const { _parsedProps: props } = copperPour
  // `outline` points are already in board/circuit world coordinates: +X right,
  // +Y up, millimeters. With every clearance operation explicitly disabled,
  // preserve that authored polygon instead of round-tripping it through the
  // geometric solver.
  const canPreserveOutline =
    props.outline !== undefined &&
    !props.crosshatch &&
    props.padMargin === 0 &&
    props.traceMargin === 0 &&
    props.clearance === 0 &&
    props.boardEdgeMargin === 0 &&
    props.cutoutMargin === 0 &&
    !props.useThermalReliefs

  if (!canPreserveOutline) return false

  const insertedPour = db.pcb_copper_pour.insert({
    shape: "polygon",
    points: props.outline,
    layer: props.layer,
    source_net_id: sourceNetId,
    subcircuit_id: subcircuitId,
    covered_with_solder_mask: props.coveredWithSolderMask ?? false,
  })
  markTraceSegmentsInsideCopperPour({ db, copperPour: insertedPour })
  return true
}
