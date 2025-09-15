import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import {
  getRefKey,
  parseRefKey,
  type PortReference,
} from "@tscircuit/schematic-match-adapt"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"

function getConnectivityNetIdFromPortRef(
  pref: PortReference,
  db: CircuitJsonUtilObjects,
): {
  subcircuit_connectivity_map_key: string | null
  source_port_id: string
} | null {
  if ("boxId" in pref) {
    const { boxId: sourceComponentName, pinNumber } = pref

    const sourceComp = db.source_component.getWhere({
      name: sourceComponentName,
    })
    if (!sourceComp) {
      throw new Error(
        `Source component "${sourceComponentName}" not found, but returned from match-adapt ${JSON.stringify(pref)}`,
      )
    }

    const sourcePort = db.source_port.getWhere({
      source_component_id: sourceComp.source_component_id,
      pin_number: pinNumber,
    })!

    return {
      subcircuit_connectivity_map_key:
        sourcePort?.subcircuit_connectivity_map_key ?? null,
      source_port_id: sourcePort.source_port_id!,
    }
  }
  if ("netId" in pref) {
    const { netId: sourceNetName } = pref

    const sourceNet = db.source_net.getWhere({ name: sourceNetName })

    // TODO Source nets should have connectivity net ids but currently don't
    return null
  }

  if ("junctionId" in pref) {
    const { junctionId } = pref

    // A junction is a construct created by match-adapt, prefer using the
    // connectivity_net_id of a different port reference
    return null
  }

  return null
}

export function deriveSourceTraceIdFromMatchAdaptPath({
  path,
  db,
  layoutConnMap,
}: {
  path: {
    to: PortReference
    from: PortReference
  }
  db: CircuitJsonUtilObjects
  layoutConnMap: ConnectivityMap
}) {
  let bestRef =
    getConnectivityNetIdFromPortRef(path.to, db) ??
    getConnectivityNetIdFromPortRef(path.from, db)

  if (!bestRef) {
    // We're not able to derive a good reference from the given to/from (maybe
    // this is a junction that connects to a net) so we'll instead try to
    // find any suitable connected port
    const layoutConnNetId = layoutConnMap.getNetConnectedToId(
      getRefKey(path.to),
    )!
    const layoutConnectedRefs = layoutConnMap
      .getIdsConnectedToNet(layoutConnNetId)
      .map((prefStr) => parseRefKey(prefStr))

    // TODO we should use the CLOSEST port on the schematic to the path, this
    // will require passing in more of the layout information and ordering the
    // connected refs by their distance to the path
    bestRef = layoutConnectedRefs
      .map((ref) => getConnectivityNetIdFromPortRef(ref, db))
      .find(Boolean)!
  }

  if (!bestRef?.subcircuit_connectivity_map_key) {
    throw new Error(
      `No connectivity net id found for match-adapt path ${JSON.stringify(path)}`,
    )
  }

  const sourceTraces = db.source_trace.list({
    subcircuit_connectivity_map_key: bestRef.subcircuit_connectivity_map_key,
  })

  // Which source trace is most applicable? If it contains a direct port reference,
  // then that's the one to use!

  for (const sourceTrace of sourceTraces) {
    if (
      sourceTrace.connected_source_port_ids.includes(bestRef.source_port_id)
    ) {
      return sourceTrace.source_trace_id
    }
  }

  if (sourceTraces.length > 0) {
    return sourceTraces[0].source_trace_id
  }

  throw new Error(
    `No source trace found for match-adapt path "${JSON.stringify(path)}"`,
  )
}
