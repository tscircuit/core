import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  SourceComponentBase,
  SourceNet,
  SourcePort,
  SourceSimpleCapacitor,
  SourceSimpleChip,
  SourceTrace,
} from "circuit-json"
import { getSourcePortConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { GROUND_NET_REGEX } from "lib/utils/gnd-power-net-regex"

type SourceComponentId = SourceComponentBase["source_component_id"]
type SourceNetId = SourceNet["source_net_id"]
type SourcePortId = SourcePort["source_port_id"]
type SourceConnectivityId = SourcePortId | SourceNetId

const COMMON_POWER_INPUT_PIN_REGEX =
  /^(?:VCC|VDD|AVCC|AVDD|DVCC|DVDD|PVCC|PVDD|IOVCC|IOVDD)[A-Z0-9_]*$/i

export interface SourceComponentPort extends SourcePort {
  source_component_id: SourceComponentId
}

export interface DecouplingCapacitorRelationship {
  chipSourceComponent: SourceSimpleChip
  capacitorSourceComponent: SourceSimpleCapacitor
  chipPowerSourcePort: SourceComponentPort
  capacitorPowerSourcePort: SourceComponentPort
  capacitorGroundSourcePort: SourceComponentPort
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
  if (sourcePort.requires_power !== undefined) {
    return sourcePort.requires_power
  }
  if (sourcePort.provides_power === true) return false

  return getSourcePortLabels(sourcePort).some((label) =>
    COMMON_POWER_INPUT_PIN_REGEX.test(label),
  )
}

const sourcePortLooksLikeGround = (sourcePort: SourcePort): boolean =>
  sourcePort.requires_ground === true ||
  sourcePort.provides_ground === true ||
  getSourcePortLabels(sourcePort).some((label) => GROUND_NET_REGEX.test(label))

const isSourceSimpleChip = (
  sourceComponent: SourceComponentBase | undefined,
): sourceComponent is SourceSimpleChip =>
  sourceComponent?.ftype === "simple_chip"

const traceDirectlyConnectsSourcePorts = (
  sourceTrace: SourceTrace,
  firstSourcePortId: SourcePortId,
  secondSourcePortId: SourcePortId,
): boolean =>
  sourceTrace.connected_source_port_ids.includes(firstSourcePortId) &&
  sourceTrace.connected_source_port_ids.includes(secondSourcePortId)

export const getDecouplingCapacitorRelationships = (
  db: CircuitJsonUtilObjects,
): DecouplingCapacitorRelationship[] => {
  const sourceComponents = db.source_component.list()
  const sourcePorts = db.source_port.list()
  const sourceTraces = db.source_trace.list()
  const sourceConnectivityMap = getSourcePortConnectivityMapFromCircuitJson(
    db.toArray(),
  )
  const sourceComponentsById = new Map<SourceComponentId, SourceComponentBase>(
    sourceComponents.map((sourceComponent) => [
      sourceComponent.source_component_id,
      sourceComponent,
    ]),
  )
  const sourcePortsById = new Map<SourcePortId, SourcePort>(
    sourcePorts.map((sourcePort) => [sourcePort.source_port_id, sourcePort]),
  )
  const sourceNetsById = new Map<SourceNetId, SourceNet>(
    db.source_net
      .list()
      .map((sourceNet) => [sourceNet.source_net_id, sourceNet]),
  )

  const getIdsConnectedToSourcePort = (
    sourcePortId: SourcePortId,
  ): SourceConnectivityId[] => {
    const connectivityNetId =
      sourceConnectivityMap.getNetConnectedToId(sourcePortId)
    if (!connectivityNetId) return []
    return sourceConnectivityMap.getIdsConnectedToNet(
      connectivityNetId,
    ) as SourceConnectivityId[]
  }

  const sourcePortIsConnectedToGround = (sourcePort: SourcePort): boolean => {
    const connectedIds = getIdsConnectedToSourcePort(sourcePort.source_port_id)
    const connectedSourceNets = connectedIds
      .map((connectedId) => sourceNetsById.get(connectedId))
      .filter((sourceNet): sourceNet is SourceNet => sourceNet !== undefined)

    if (connectedSourceNets.some((sourceNet) => sourceNet.is_ground)) {
      return true
    }

    return connectedIds
      .map((connectedId) => sourcePortsById.get(connectedId))
      .filter(
        (connectedSourcePort): connectedSourcePort is SourcePort =>
          connectedSourcePort !== undefined,
      )
      .some(sourcePortLooksLikeGround)
  }

  const relationships: DecouplingCapacitorRelationship[] = []

  for (const capacitorSourceComponent of sourceComponents) {
    if (capacitorSourceComponent.ftype !== "simple_capacitor") continue

    const capacitorSourcePorts = sourcePorts.filter(
      (sourcePort): sourcePort is SourceComponentPort =>
        sourcePort.source_component_id ===
        capacitorSourceComponent.source_component_id,
    )
    if (capacitorSourcePorts.length !== 2) continue

    const capacitorGroundSourcePorts = capacitorSourcePorts.filter(
      sourcePortIsConnectedToGround,
    )
    if (capacitorGroundSourcePorts.length !== 1) continue

    const capacitorGroundSourcePort = capacitorGroundSourcePorts[0]
    const capacitorPowerSourcePort = capacitorSourcePorts.find(
      (sourcePort) =>
        sourcePort.source_port_id !== capacitorGroundSourcePort.source_port_id,
    )
    if (!capacitorPowerSourcePort) continue

    const connectedPowerRailIds = new Set(
      getIdsConnectedToSourcePort(capacitorPowerSourcePort.source_port_id),
    )
    const eligibleChipPowerSourcePorts = sourcePorts.filter(
      (sourcePort): sourcePort is SourceComponentPort => {
        if (!connectedPowerRailIds.has(sourcePort.source_port_id)) return false
        if (!sourcePortShouldHaveDecouplingCapacitor(sourcePort)) return false
        if (!sourcePort.source_component_id) return false
        return (
          sourceComponentsById.get(sourcePort.source_component_id)?.ftype ===
          "simple_chip"
        )
      },
    )
    const directlyConnectedChipPowerSourcePorts =
      eligibleChipPowerSourcePorts.filter((chipPowerSourcePort) =>
        sourceTraces.some((sourceTrace) =>
          traceDirectlyConnectsSourcePorts(
            sourceTrace,
            capacitorPowerSourcePort.source_port_id,
            chipPowerSourcePort.source_port_id,
          ),
        ),
      )
    const chipPowerSourcePort =
      directlyConnectedChipPowerSourcePorts.length === 1
        ? directlyConnectedChipPowerSourcePorts[0]
        : directlyConnectedChipPowerSourcePorts.length === 0 &&
            eligibleChipPowerSourcePorts.length === 1
          ? eligibleChipPowerSourcePorts[0]
          : undefined
    if (!chipPowerSourcePort) continue

    const chipSourceComponent = sourceComponentsById.get(
      chipPowerSourcePort.source_component_id,
    )
    if (!isSourceSimpleChip(chipSourceComponent)) continue

    relationships.push({
      chipSourceComponent,
      capacitorSourceComponent,
      chipPowerSourcePort,
      capacitorPowerSourcePort,
      capacitorGroundSourcePort,
    })
  }

  return relationships
}
