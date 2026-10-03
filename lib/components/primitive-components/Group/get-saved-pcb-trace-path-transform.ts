import type { PcbPort } from "circuit-json"
import type { SimpleRouteConnection } from "lib/utils/autorouting/SimpleRouteJson"
import { compose, translate } from "transformation-matrix"
import type { Port } from "../Port"
import type { IGroup } from "./IGroup"

export function getPcbTracePathAnchorPort(
  connection: SimpleRouteConnection,
  portsByPcbPortId: ReadonlyMap<PcbPort["pcb_port_id"], Port>,
): Port | undefined {
  for (const terminal of connection.pointsToConnect) {
    const port = terminal.pcb_port_id
      ? portsByPcbPortId.get(terminal.pcb_port_id)
      : undefined
    if (port) return port
  }
}

/**
 * Local enclosing-group PCB points -> board-world points, in mm (+X right,
 * +Y up, +Z above; right-handed). Points include translation. Physical copper
 * layers do not change. Shared by the saved phase importer and exporter.
 *
 * Port layout displacement is measured against its matched PCB primitive;
 * pcb_group.center is a bounding-box center, not the placement origin.
 */
export function getSavedPcbTracePathTransform(
  group: Pick<IGroup, "_computePcbGlobalTransformBeforeLayout">,
  port: Port,
) {
  const before = port._getGlobalPcbPositionBeforeLayout()
  const after = port._getGlobalPcbPositionAfterLayout()
  return compose(
    translate(after.x - before.x, after.y - before.y),
    group._computePcbGlobalTransformBeforeLayout(),
  )
}
