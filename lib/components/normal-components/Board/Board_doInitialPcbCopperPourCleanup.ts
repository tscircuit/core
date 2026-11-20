import type { AnyCircuitElement, PcbCopperPour } from "circuit-json"
import { findFloatingCopper } from "lib/utils/copper-pour-connectivity/find-floating-copper"
import type { Board } from "./Board"

/**
 * Filter floating pour IDs to avoid deleting an entire authored `<copperpour>`
 * when none of its fragments connect to a same-net terminal, so DRC can emit
 * `pcb_copper_pour_isolated_warning` and exports retain the pour zone.
 */
const getDeletableFloatingPourIds = ({
  floatingPourIds,
  authoredPourIdGroups,
  circuitJson,
}: {
  floatingPourIds: ReadonlySet<PcbCopperPour["pcb_copper_pour_id"]>
  authoredPourIdGroups: Iterable<
    ReadonlySet<PcbCopperPour["pcb_copper_pour_id"]>
  >
  circuitJson: AnyCircuitElement[]
}) => {
  if (floatingPourIds.size === 0) return floatingPourIds
  const activePourIds = new Set(
    circuitJson
      .filter((element) => element.type === "pcb_copper_pour")
      .map((element) => element.pcb_copper_pour_id),
  )
  const deletablePourIds = new Set(floatingPourIds)
  for (const authoredPourIds of authoredPourIdGroups) {
    const groupPourIds = [...authoredPourIds].filter((pourId) =>
      activePourIds.has(pourId),
    )
    if (
      groupPourIds.length > 0 &&
      groupPourIds.every((pourId) => floatingPourIds.has(pourId))
    ) {
      for (const pourId of groupPourIds) deletablePourIds.delete(pourId)
    }
  }
  return deletablePourIds
}

export const Board_doInitialPcbCopperPourCleanup = (board: Board) => {
  if (!board.root || board.root.pcbDisabled) return
  const { db } = board.root
  if (db.pcb_copper_pour.list().length === 0) return
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
  const deletableFloatingPourIds = getDeletableFloatingPourIds({
    floatingPourIds,
    authoredPourIdGroups: board._authoredCopperPourIdGroups.values(),
    circuitJson,
  })
  for (const pourId of deletableFloatingPourIds)
    db.pcb_copper_pour.delete(pourId)
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
          deletableFloatingPourIds.has(point.copper_pour_id),
      )
    )
      continue
    db.pcb_trace.update(trace.pcb_trace_id, {
      route: trace.route.map((point) => {
        if (
          !("copper_pour_id" in point) ||
          !point.copper_pour_id ||
          !deletableFloatingPourIds.has(point.copper_pour_id)
        )
          return point
        const { copper_pour_id, is_inside_copper_pour, ...wireOrVia } = point
        return wireOrVia
      }),
    })
  }
}
