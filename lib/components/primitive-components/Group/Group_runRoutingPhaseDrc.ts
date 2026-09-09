import {
  intermediateRoutingChecks,
  runAllRoutingChecks,
} from "@tscircuit/checks"
import { su } from "@tscircuit/circuit-json-util"
import type { AutoroutingPhase } from "circuit-json"
import type { Group } from "./Group"
import type { RoutingPhaseDrcTolerances } from "./GroupRoutingPhasePlan"

/** Check the accumulated board geometry after a local routing stage.
 * Geometry stays in circuit world coordinates (mm, +X right, +Y up).
 * Both the database and routing result are copied because rendering mutates them.
 */
export async function Group_runRoutingPhaseDrc(
  group: Group<any>,
  result: Group<any>["_asyncAutoroutingResult"],
  phase: AutoroutingPhase,
  tolerances?: RoutingPhaseDrcTolerances,
) {
  const drcDisabled =
    group.root?.platform?.drcChecksDisabled ??
    group.getInheritedProperty("drcChecksDisabled")
  const routingDrcDisabled =
    group.root?.platform?.routingDrcChecksDisabled ??
    group.getInheritedProperty("routingDrcChecksDisabled")
  if (drcDisabled || routingDrcDisabled || !result) return undefined

  const phaseDb = su(structuredClone(group.root!.db.toArray()))
  const boardId = group._getBoard()?.pcb_board_id
  const board = boardId
    ? phaseDb.pcb_board.get(boardId)
    : phaseDb.pcb_board.list()[0]
  if (board && tolerances) {
    const overrides = {
      min_trace_width: tolerances.minTraceWidth,
      min_board_edge_clearance: tolerances.minBoardEdgeClearance,
      min_via_hole_edge_to_via_hole_edge_clearance:
        tolerances.minViaHoleEdgeToViaHoleEdgeClearance,
      min_plated_hole_drill_edge_to_drill_edge_clearance:
        tolerances.minPlatedHoleDrillEdgeToDrillEdgeClearance,
      min_trace_to_pad_edge_clearance: tolerances.minTraceToPadEdgeClearance,
      min_pad_edge_to_pad_edge_clearance:
        tolerances.minPadEdgeToPadEdgeClearance,
      min_via_edge_to_pad_edge_clearance:
        tolerances.minViaEdgeToPadEdgeClearance,
      min_via_hole_diameter: tolerances.minViaHoleDiameter,
      min_via_pad_diameter: tolerances.minViaPadDiameter,
    }
    phaseDb.pcb_board.update(
      board.pcb_board_id,
      Object.fromEntries(
        Object.entries(overrides).filter(([, value]) => value !== undefined),
      ),
    )
  }
  // Reuse final rendering for jumper pads, via dimensions and replacements.
  group._updatePcbTraceRenderFromPcbTraces(structuredClone(result), phaseDb)
  return runAllRoutingChecks(phaseDb.toArray(), {
    checks: intermediateRoutingChecks,
    autoroutingPhase: phase,
  })
}
