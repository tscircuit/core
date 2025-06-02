import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PortReference } from "@tscircuit/schematic-match-adapt"

function getSchematicPortIdFromPortRef(pref: {
  boxId: string
  pinNumber: number
}) {
  // TODO
}

function getConnectivityNetFromPortRef(
  pref: PortReference,
  db: CircuitJsonUtilObjects,
): string | null {
  if ("boxId" in pref) {
    const { boxId: sourceComponentName, pinNumber } = pref

    const sourceComp = db.source_component.getWhere({
      name: sourceComponentName,
    })
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
}

export function getConnectivityNetIdFromPortRef(
  pref: PortReference,
  db: CircuitJsonUtilObjects,
) {
  // TODO
}

export function getSourceTraceIdFromConnectivityNetId(
  cnid: string,
  db: CircuitJsonUtilObjects,
) {
  // TODO
}

export function deriveSourceTraceIdFromPath(
  params: {
    to: PortReference
    from: PortReference
  },
  db: CircuitJsonUtilObjects,
) {
  // TODO
}
