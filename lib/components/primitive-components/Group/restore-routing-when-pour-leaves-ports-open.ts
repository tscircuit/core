import { checkEachPcbPortConnectedToPcbTraces } from "@tscircuit/checks"
import type { Group } from "./Group"

/**
 * The pour plan runs before signal traces exist. A later trace can cut an
 * island the autorouter treated as already connected, which leaves those pads
 * open. Drop that route and run the autorouter once more without the hint.
 *
 * Jumpers and routed test points insert components this undo does not remove,
 * so a route that created them keeps the first result.
 */
export async function restoreRoutingWhenPourLeavesPortsOpen(
  group: Group<any>,
): Promise<boolean> {
  if (
    !group._routedWithPourConnectedPorts ||
    group._didRestoreRoutingAfterCutPour
  ) {
    return false
  }
  // A remote solve is not replayed here. Local routing can run again.
  if (!group._getAutorouterConfig().local) return false
  if (group._autorouteMaterializedTestPoints) return false
  if ((group._asyncAutoroutingResult?.output_jumpers?.length ?? 0) > 0) {
    return false
  }

  const db = group.root?.db
  if (!db) return false

  const pourConnectedPcbPortIds = new Set(group._pourConnectedPcbPortIds)
  const openPortErrors = checkEachPcbPortConnectedToPcbTraces(
    db.toArray(),
  ).filter(
    (error) =>
      portWasLeftOpen(error.message) &&
      error.pcb_port_ids.some((pcbPortId) =>
        pourConnectedPcbPortIds.has(pcbPortId),
      ),
  )
  if (openPortErrors.length === 0) return false

  group._didRestoreRoutingAfterCutPour = true
  const autoroutedPcbTraceIds = new Set(group._autoroutedPcbTraceIds)

  for (const pour of db.pcb_copper_pour.list()) {
    if (pour.subcircuit_id === group.subcircuit_id) {
      db.pcb_copper_pour.delete(pour.pcb_copper_pour_id)
    }
  }
  for (const via of db.pcb_via.list()) {
    if (via.subcircuit_id !== group.subcircuit_id || !via.net_is_assignable) {
      continue
    }
    if (
      via.pcb_trace_id &&
      autoroutedPcbTraceIds.has(via.pcb_trace_id) &&
      via.net_assigned
    ) {
      db.pcb_via.update(via.pcb_via_id, { net_assigned: false })
    }
  }
  for (const pcbViaId of group._autoroutedPcbViaIds) {
    if (db.pcb_via.get(pcbViaId)) db.pcb_via.delete(pcbViaId)
  }
  for (const pcbTraceId of group._autoroutedPcbTraceIds) {
    if (db.pcb_trace.get(pcbTraceId)) db.pcb_trace.delete(pcbTraceId)
  }
  group._autoroutedPcbTraceIds = []
  group._autoroutedPcbViaIds = []
  group._routedWithPourConnectedPorts = false

  await group._runLocalAutorouting({ ignorePourConnectedPorts: true })
  group.updatePcbTraceRender()
  return true
}

/** Layer-mismatch errors name a missing via. These name a pad the net never reached. */
function portWasLeftOpen(message: string): boolean {
  return (
    message.includes("is not connected to net") ||
    message.includes("is not connected to its connected net") ||
    message.includes("are not connected together through the same net")
  )
}
