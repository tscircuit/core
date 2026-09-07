import { findFloatingCopper } from "lib/utils/copper-pour-connectivity/find-floating-copper"
import type { Board } from "./Board"

export const Board_doInitialPcbCopperPourCleanup = (board: Board) => {
  if (!board.root || board.root.pcbDisabled) return
  const { db } = board.root
  const circuitJson = db
    .subtree({ subcircuit_id: board.subcircuit_id })
    .toArray()
  // Failed or skipped autorouting leaves intended copper connections missing.
  // Preserve the pours until routing succeeds so cleanup cannot mistake those
  // incomplete connections for electrically isolated islands.
  // Autorouting error records lack subtree IDs, so read them from the root DB.
  if (db.pcb_autorouting_error.list().length > 0) return
  if (!circuitJson.some((element) => element.type === "pcb_copper_pour")) return
  const { floatingPourIds, floatingViaIds } = findFloatingCopper(
    circuitJson,
    board._generatedStitchingViaIds,
  )
  for (const pourId of floatingPourIds) db.pcb_copper_pour.delete(pourId)
  for (const viaId of floatingViaIds) {
    // Preserve user-authored vias; only cleanup vias created by stitching.
    if (board._generatedStitchingViaIds.has(viaId)) db.pcb_via.delete(viaId)
  }
  for (const trace of db.pcb_trace.list()) {
    if (
      !trace.route.some(
        (point) =>
          "copper_pour_id" in point &&
          point.copper_pour_id &&
          floatingPourIds.has(point.copper_pour_id),
      )
    )
      continue
    db.pcb_trace.update(trace.pcb_trace_id, {
      route: trace.route.map((point) => {
        if (
          !("copper_pour_id" in point) ||
          !point.copper_pour_id ||
          !floatingPourIds.has(point.copper_pour_id)
        )
          return point
        const { copper_pour_id, is_inside_copper_pour, ...wireOrVia } = point
        return wireOrVia
      }),
    })
  }
}
