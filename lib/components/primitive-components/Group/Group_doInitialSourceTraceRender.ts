import type { SourceNet } from "circuit-json"
import {
  GROUND_NET_REGEX,
  POWER_NET_REGEX,
} from "lib/utils/gnd-power-net-regex"
import type { Group } from "./Group"

const normalizeNetName = (netName: string) =>
  netName.startsWith("net.") ? netName.slice("net.".length) : netName

const getSourceNet = (
  group: Group<any>,
  subcircuitId: string,
  netName: string,
): SourceNet | undefined =>
  group
    .root!.db.source_net.list()
    .find((net) => net.subcircuit_id === subcircuitId && net.name === netName)

const getOrCreateParentSourceNet = (
  group: Group<any>,
  subcircuitId: string,
  netName: string,
): SourceNet => {
  const existingNet = getSourceNet(group, subcircuitId, netName)
  if (existingNet) return existingNet

  const isGround = GROUND_NET_REGEX.test(netName)
  const isPositiveVoltageSource = POWER_NET_REGEX.test(netName)

  return group.root!.db.source_net.insert({
    name: netName,
    member_source_group_ids: [],
    is_ground: isGround,
    is_power: isPositiveVoltageSource,
    is_positive_voltage_source: isPositiveVoltageSource,
    subcircuit_id: subcircuitId,
  })
}

export function Group_doInitialSourceTraceRender(group: Group<any>) {
  if (!group.isSubcircuit) return

  const exposedNets = group._parsedProps.exposedNets
  if (!exposedNets?.length) return

  const parentSubcircuit = group.parent?.getSubcircuit?.()
  const parentSubcircuitId = parentSubcircuit?.subcircuit_id
  if (!parentSubcircuitId) return
  if (parentSubcircuitId === group.subcircuit_id) return

  const { db } = group.root!

  for (const exposedNetName of exposedNets) {
    const netName = normalizeNetName(exposedNetName)
    const childNet = getSourceNet(group, group.subcircuit_id!, netName)
    if (!childNet) continue

    const parentNet = getOrCreateParentSourceNet(
      group,
      parentSubcircuitId,
      netName,
    )
    const connectedNetIds = [
      childNet.source_net_id,
      parentNet.source_net_id,
    ].sort()

    const existingTrace = db.source_trace.list().find((trace) => {
      if (trace.connected_source_port_ids.length > 0) return false
      return (
        trace.connected_source_net_ids.length === connectedNetIds.length &&
        [...trace.connected_source_net_ids].sort().join(",") ===
          connectedNetIds.join(",")
      )
    })
    if (existingTrace) continue

    db.source_trace.insert({
      connected_source_port_ids: [],
      connected_source_net_ids: connectedNetIds,
      subcircuit_id: parentSubcircuitId,
      name: `exposed_net.${netName}`,
      display_name: netName,
    })
  }
}
