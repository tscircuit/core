import { getPourPolygon } from "@tscircuit/circuit-json-util"
import type { PcbCopperPour } from "circuit-json"
import { CopperPour } from "lib/components/primitive-components/CopperPour"
import { findFloatingCopper } from "lib/utils/copper-pour-connectivity/find-floating-copper"
import type { Board } from "./Board"

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

  if (floatingPourIds.size === 0) return
  const removedPoursById = new Map<
    PcbCopperPour["pcb_copper_pour_id"],
    PcbCopperPour
  >()
  for (const element of circuitJson) {
    if (element.type !== "pcb_copper_pour") continue
    const pourId = element.pcb_copper_pour_id
    if (floatingPourIds.has(pourId) && !db.pcb_copper_pour.get(pourId)) {
      removedPoursById.set(pourId, element)
    }
  }

  for (const descendant of board.getDescendants()) {
    if (!(descendant instanceof CopperPour)) continue
    const [firstPourId, ...otherPourIds] = descendant.pcb_copper_pour_ids
    if (firstPourId === undefined) continue
    const pour = removedPoursById.get(firstPourId)
    if (!pour || !otherPourIds.every((pourId) => removedPoursById.has(pourId)))
      continue

    const net = pour.source_net_id
      ? db.source_net.get(pour.source_net_id)
      : undefined
    const netName = net?.name || "unnamed net"
    const box = getPourPolygon(pour).box
    db.pcb_copper_pour_isolated_warning.insert({
      warning_type: "pcb_copper_pour_isolated_warning",
      pcb_copper_pour_id: pour.pcb_copper_pour_id,
      source_net_id: pour.source_net_id,
      subcircuit_id: pour.subcircuit_id,
      layer: pour.layer,
      // Point at the first removed fragment's bounding-box center in
      // board-world millimeters (+X right, +Y up, right-handed).
      center: { x: (box.xmin + box.xmax) / 2, y: (box.ymin + box.ymax) / 2 },
      message: `Copper pour for ${netName} on ${pour.layer} was removed because its connected copper has no path to a same-net pad or an explicitly placed via. Connect the pour to a same-net pad or an explicitly placed via, or use autorouter="fanout".`,
    })
  }
}
