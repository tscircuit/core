import type { SourceNet, SourcePort } from "circuit-json"
import { getNetNameFromSourcePorts } from "lib/utils/schematic/getSourcePortNetLabelText"
import { Port } from "../../Port"
import { Group } from "../Group"
import { getNetNameFromPorts } from "./getNetNameFromPorts"

type SubcircuitConnectivityMapKey = NonNullable<
  SourcePort["subcircuit_connectivity_map_key"]
>

const appendToMap = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
  const values = map.get(key)
  if (values) {
    values.push(value)
  } else {
    map.set(key, [value])
  }
}

export const createCanonicalSchematicNetLabelTextResolver = (
  group: Group<any>,
) => {
  const { db } = group.root!
  const sourceNetByConnectionKey = new Map<
    SubcircuitConnectivityMapKey,
    SourceNet
  >()
  const portsByConnectionKey = new Map<SubcircuitConnectivityMapKey, Port[]>()
  const sourcePortIdsByConnectionKey = new Map<
    SubcircuitConnectivityMapKey,
    SourcePort["source_port_id"][]
  >()
  const resolvedTextByConnectionKey = new Map<
    SubcircuitConnectivityMapKey,
    { name: string; wasAssignedDisplayLabel: boolean }
  >()

  for (const sourceNet of db.source_net.list()) {
    if (sourceNet.subcircuit_connectivity_map_key) {
      sourceNetByConnectionKey.set(
        sourceNet.subcircuit_connectivity_map_key,
        sourceNet,
      )
    }
  }

  for (const port of group.selectAll<Port>("port")) {
    const connectionKey = port._getSubcircuitConnectivityKey()
    if (connectionKey) {
      appendToMap(portsByConnectionKey, connectionKey, port)
    }
  }

  for (const sourcePort of db.source_port.list()) {
    if (sourcePort.subcircuit_connectivity_map_key) {
      appendToMap(
        sourcePortIdsByConnectionKey,
        sourcePort.subcircuit_connectivity_map_key,
        sourcePort.source_port_id,
      )
    }
  }

  return ({
    subcircuitConnectivityMapKey,
  }: {
    subcircuitConnectivityMapKey: SubcircuitConnectivityMapKey
  }): { name: string; wasAssignedDisplayLabel: boolean } => {
    const cached = resolvedTextByConnectionKey.get(subcircuitConnectivityMapKey)
    if (cached) return cached

    const resolvedSourceNet = sourceNetByConnectionKey.get(
      subcircuitConnectivityMapKey,
    )

    if (resolvedSourceNet?.name) {
      const result = {
        name: resolvedSourceNet.name,
        wasAssignedDisplayLabel: true,
      }
      resolvedTextByConnectionKey.set(subcircuitConnectivityMapKey, result)
      return result
    }

    const portLabel = getNetNameFromPorts(
      portsByConnectionKey.get(subcircuitConnectivityMapKey) ?? [],
    )
    if (portLabel.name) {
      resolvedTextByConnectionKey.set(subcircuitConnectivityMapKey, portLabel)
      return portLabel
    }

    const result = {
      name:
        getNetNameFromSourcePorts(
          db,
          sourcePortIdsByConnectionKey.get(subcircuitConnectivityMapKey) ?? [],
        ) ?? "",
      wasAssignedDisplayLabel: false,
    }
    resolvedTextByConnectionKey.set(subcircuitConnectivityMapKey, result)
    return result
  }
}
