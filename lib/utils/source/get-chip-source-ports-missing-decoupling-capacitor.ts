import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  SourceComponentBase,
  SourceNet,
  SourcePort,
  SourceSimpleCapacitor,
} from "circuit-json"
import { getSourcePortConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import {
  GROUND_NET_REGEX,
  POWER_NET_REGEX,
} from "lib/utils/gnd-power-net-regex"

type SourceComponentId = SourceComponentBase["source_component_id"]
type SourceNetId = SourceNet["source_net_id"]
type SourcePortId = SourcePort["source_port_id"]
type SourceConnectivityId = SourceNetId | SourcePortId

interface SourceCircuitRelationships {
  areConnected: (
    firstSourceConnectivityId: SourceConnectivityId,
    secondSourceConnectivityId: SourceConnectivityId,
  ) => boolean
  sourcePortHasConnection: (sourcePortId: SourcePortId) => boolean
  sourcePortIsConnectedToGround: (sourcePort: SourcePort) => boolean
}

const getSourcePortLabels = (sourcePort: SourcePort): string[] => [
  sourcePort.name,
  ...(sourcePort.port_hints ?? []),
]

const sourcePortShouldHaveDecouplingCapacitor = (
  sourcePort: SourcePort,
): boolean => {
  if (sourcePort.should_have_decoupling_capacitor !== undefined) {
    return sourcePort.should_have_decoupling_capacitor
  }
  if (sourcePort.provides_power === true) return false
  if (sourcePort.requires_power !== undefined) return sourcePort.requires_power

  return getSourcePortLabels(sourcePort).some((sourcePortLabel) =>
    POWER_NET_REGEX.test(sourcePortLabel),
  )
}

const sourcePortLooksLikeGround = (sourcePort: SourcePort): boolean =>
  sourcePort.requires_ground === true ||
  sourcePort.provides_ground === true ||
  getSourcePortLabels(sourcePort).some((sourcePortLabel) =>
    GROUND_NET_REGEX.test(sourcePortLabel),
  )

const getSourcePortsBySourceComponentId = (
  sourcePorts: SourcePort[],
): Map<SourceComponentId, SourcePort[]> => {
  const sourcePortsBySourceComponentId = new Map<
    SourceComponentId,
    SourcePort[]
  >()

  for (const sourcePort of sourcePorts) {
    if (!sourcePort.source_component_id) continue
    const componentSourcePorts =
      sourcePortsBySourceComponentId.get(sourcePort.source_component_id) ?? []
    componentSourcePorts.push(sourcePort)
    sourcePortsBySourceComponentId.set(
      sourcePort.source_component_id,
      componentSourcePorts,
    )
  }

  return sourcePortsBySourceComponentId
}

const createSourceCircuitRelationships = (
  db: CircuitJsonUtilObjects,
  sourcePorts: SourcePort[],
): SourceCircuitRelationships => {
  const sourceConnectivityMap = getSourcePortConnectivityMapFromCircuitJson(
    db.toArray(),
  )
  const groundSourcePorts = sourcePorts.filter(sourcePortLooksLikeGround)
  const groundSourceNets = db.source_net
    .list()
    .filter((sourceNet) => sourceNet.is_ground)

  const areConnected = (
    firstSourceConnectivityId: SourceConnectivityId,
    secondSourceConnectivityId: SourceConnectivityId,
  ): boolean =>
    sourceConnectivityMap.areIdsConnected(
      firstSourceConnectivityId,
      secondSourceConnectivityId,
    )

  return {
    areConnected,
    sourcePortHasConnection: (sourcePortId) => {
      const connectedNetId =
        sourceConnectivityMap.getNetConnectedToId(sourcePortId)
      if (!connectedNetId) return false
      return sourceConnectivityMap
        .getIdsConnectedToNet(connectedNetId)
        .some((connectedId) => connectedId !== sourcePortId)
    },
    sourcePortIsConnectedToGround: (sourcePort) =>
      groundSourcePorts.some((groundSourcePort) =>
        areConnected(
          sourcePort.source_port_id,
          groundSourcePort.source_port_id,
        ),
      ) ||
      groundSourceNets.some((groundSourceNet) =>
        areConnected(sourcePort.source_port_id, groundSourceNet.source_net_id),
      ),
  }
}

const capacitorConnectsChipPowerSourcePortToGround = ({
  capacitorSourcePorts,
  chipPowerSourcePort,
  sourceCircuitRelationships,
}: {
  capacitorSourcePorts: SourcePort[]
  chipPowerSourcePort: SourcePort
  sourceCircuitRelationships: SourceCircuitRelationships
}): boolean => {
  if (capacitorSourcePorts.length !== 2) return false

  const [firstCapacitorSourcePort, secondCapacitorSourcePort] =
    capacitorSourcePorts
  const capacitorPortsBridgePowerToGround = (
    capacitorPowerSourcePort: SourcePort,
    capacitorGroundSourcePort: SourcePort,
  ): boolean =>
    sourceCircuitRelationships.areConnected(
      chipPowerSourcePort.source_port_id,
      capacitorPowerSourcePort.source_port_id,
    ) &&
    sourceCircuitRelationships.sourcePortIsConnectedToGround(
      capacitorGroundSourcePort,
    )

  return (
    capacitorPortsBridgePowerToGround(
      firstCapacitorSourcePort,
      secondCapacitorSourcePort,
    ) ||
    capacitorPortsBridgePowerToGround(
      secondCapacitorSourcePort,
      firstCapacitorSourcePort,
    )
  )
}

export const getChipSourcePortsMissingDecouplingCapacitor = (
  db: CircuitJsonUtilObjects,
  chipSourceComponentId: SourceComponentId,
): SourcePort[] => {
  const chipSourceComponent = db.source_component.get(chipSourceComponentId)
  if (chipSourceComponent?.ftype !== "simple_chip") return []

  const sourcePorts = db.source_port.list()
  const sourcePortsBySourceComponentId =
    getSourcePortsBySourceComponentId(sourcePorts)
  const sourceCircuitRelationships = createSourceCircuitRelationships(
    db,
    sourcePorts,
  )
  const capacitorSourceComponents = db.source_component
    .list()
    .filter(
      (sourceComponent): sourceComponent is SourceSimpleCapacitor =>
        sourceComponent.ftype === "simple_capacitor",
    )
  const chipSourcePorts =
    sourcePortsBySourceComponentId.get(chipSourceComponentId) ?? []
  const sourcePortsMissingDecouplingCapacitor: SourcePort[] = []

  for (const chipSourcePort of chipSourcePorts) {
    if (!sourcePortShouldHaveDecouplingCapacitor(chipSourcePort)) continue
    if (
      !sourceCircuitRelationships.sourcePortHasConnection(
        chipSourcePort.source_port_id,
      )
    ) {
      continue
    }

    let hasDecouplingCapacitor = false
    for (const capacitorSourceComponent of capacitorSourceComponents) {
      const capacitorSourcePorts =
        sourcePortsBySourceComponentId.get(
          capacitorSourceComponent.source_component_id,
        ) ?? []
      if (
        capacitorConnectsChipPowerSourcePortToGround({
          capacitorSourcePorts,
          chipPowerSourcePort: chipSourcePort,
          sourceCircuitRelationships,
        })
      ) {
        hasDecouplingCapacitor = true
        break
      }
    }

    if (!hasDecouplingCapacitor) {
      sourcePortsMissingDecouplingCapacitor.push(chipSourcePort)
    }
  }

  return sourcePortsMissingDecouplingCapacitor
}
