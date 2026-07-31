import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  SourceComponentBase,
  SourcePort,
  SourceSimpleCapacitor,
} from "circuit-json"
import { getSourcePortConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { GROUND_NET_REGEX } from "lib/utils/gnd-power-net-regex"

type SourceComponentId = SourceComponentBase["source_component_id"]

const COMMON_POWER_INPUT_PIN_REGEX =
  /^(?:VCC|VDD|AVCC|AVDD|DVCC|DVDD|PVCC|PVDD|IOVCC|IOVDD)[A-Z0-9_]*$/i

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
    COMMON_POWER_INPUT_PIN_REGEX.test(sourcePortLabel),
  )
}

const sourcePortLooksLikeGround = (sourcePort: SourcePort): boolean =>
  sourcePort.requires_ground === true ||
  sourcePort.provides_ground === true ||
  getSourcePortLabels(sourcePort).some((sourcePortLabel) =>
    GROUND_NET_REGEX.test(sourcePortLabel),
  )

export const getChipSourcePortsMissingDecouplingCapacitor = (
  db: CircuitJsonUtilObjects,
  chipSourceComponentId: SourceComponentId,
): SourcePort[] => {
  const chipSourceComponent = db.source_component.get(chipSourceComponentId)
  if (chipSourceComponent?.ftype !== "simple_chip") return []

  const sourcePorts = db.source_port.list()
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

  const capacitorSourceComponents = db.source_component
    .list()
    .filter(
      (sourceComponent): sourceComponent is SourceSimpleCapacitor =>
        sourceComponent.ftype === "simple_capacitor",
    )
  const sourceConnectivityMap = getSourcePortConnectivityMapFromCircuitJson(
    db.toArray(),
  )
  const groundSourcePorts = sourcePorts.filter(sourcePortLooksLikeGround)
  const groundSourceNets = db.source_net
    .list()
    .filter((sourceNet) => sourceNet.is_ground)

  const sourcePortIsConnectedToGround = (sourcePort: SourcePort): boolean =>
    groundSourcePorts.some((groundSourcePort) =>
      sourceConnectivityMap.areIdsConnected(
        sourcePort.source_port_id,
        groundSourcePort.source_port_id,
      ),
    ) ||
    groundSourceNets.some((groundSourceNet) =>
      sourceConnectivityMap.areIdsConnected(
        sourcePort.source_port_id,
        groundSourceNet.source_net_id,
      ),
    )

  const chipPowerSourcePorts = (
    sourcePortsBySourceComponentId.get(chipSourceComponentId) ?? []
  ).filter((sourcePort) => {
    if (!sourcePortShouldHaveDecouplingCapacitor(sourcePort)) return false
    const connectedNetId = sourceConnectivityMap.getNetConnectedToId(
      sourcePort.source_port_id,
    )
    if (!connectedNetId) return false
    return sourceConnectivityMap
      .getIdsConnectedToNet(connectedNetId)
      .some((connectedId) => connectedId !== sourcePort.source_port_id)
  })

  return chipPowerSourcePorts.filter(
    (chipPowerSourcePort) =>
      !capacitorSourceComponents.some((capacitorSourceComponent) => {
        const capacitorSourcePorts =
          sourcePortsBySourceComponentId.get(
            capacitorSourceComponent.source_component_id,
          ) ?? []
        if (capacitorSourcePorts.length !== 2) return false

        return capacitorSourcePorts.some(
          (capacitorPowerSourcePort, capacitorPowerSourcePortIndex) => {
            const capacitorGroundSourcePort =
              capacitorSourcePorts[1 - capacitorPowerSourcePortIndex]
            return (
              sourceConnectivityMap.areIdsConnected(
                chipPowerSourcePort.source_port_id,
                capacitorPowerSourcePort.source_port_id,
              ) && sourcePortIsConnectedToGround(capacitorGroundSourcePort)
            )
          },
        )
      }),
  )
}
