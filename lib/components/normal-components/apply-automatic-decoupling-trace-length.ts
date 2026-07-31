import type { SourcePort } from "circuit-json"
import {
  GROUND_NET_REGEX,
  POWER_NET_REGEX,
} from "lib/utils/gnd-power-net-regex"
import type { Capacitor } from "./Capacitor"

const DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM = 1

const portHintsMatch = (sourcePort: SourcePort, pattern: RegExp): boolean =>
  sourcePort.port_hints?.some((portHint) => pattern.test(portHint)) ?? false

const chipPortShouldHaveDecouplingCapacitor = (
  sourcePort: SourcePort,
  capacitor: Capacitor,
): boolean => {
  if (!sourcePort.source_component_id) return false

  const sourceComponent = capacitor.root!.db.source_component.get(
    sourcePort.source_component_id,
  )
  if (sourceComponent?.ftype !== "simple_chip") return false

  if (sourcePort.should_have_decoupling_capacitor !== undefined) {
    return sourcePort.should_have_decoupling_capacitor
  }

  return (
    sourcePort.requires_power ?? portHintsMatch(sourcePort, POWER_NET_REGEX)
  )
}

const sourcePortIsGround = (sourcePort: SourcePort): boolean =>
  sourcePort.provides_ground === true ||
  sourcePort.requires_ground === true ||
  portHintsMatch(sourcePort, GROUND_NET_REGEX)

export const applyAutomaticDecouplingTraceLength = (
  capacitor: Capacitor,
): void => {
  if (
    capacitor._parsedProps.maxDecouplingTraceLength !== undefined ||
    !capacitor.source_component_id
  ) {
    return
  }

  const { db } = capacitor.root!
  const allSourcePorts = db.source_port.list()
  const capacitorSourcePorts = allSourcePorts.filter(
    (sourcePort) =>
      sourcePort.source_component_id === capacitor.source_component_id,
  )

  const chipPowerConnectivityMapKeys = new Set(
    allSourcePorts
      .filter(
        (sourcePort) =>
          sourcePort.subcircuit_connectivity_map_key !== undefined &&
          chipPortShouldHaveDecouplingCapacitor(sourcePort, capacitor),
      )
      .map((sourcePort) => sourcePort.subcircuit_connectivity_map_key!),
  )
  const groundConnectivityMapKeys = new Set([
    ...db.source_net
      .list()
      .filter(
        (sourceNet) =>
          sourceNet.is_ground === true &&
          sourceNet.subcircuit_connectivity_map_key !== undefined,
      )
      .map((sourceNet) => sourceNet.subcircuit_connectivity_map_key!),
    ...allSourcePorts
      .filter(
        (sourcePort) =>
          sourcePort.subcircuit_connectivity_map_key !== undefined &&
          sourcePortIsGround(sourcePort),
      )
      .map((sourcePort) => sourcePort.subcircuit_connectivity_map_key!),
  ])

  const powerSideSourcePort = capacitorSourcePorts.find(
    (sourcePort) =>
      sourcePort.subcircuit_connectivity_map_key !== undefined &&
      chipPowerConnectivityMapKeys.has(
        sourcePort.subcircuit_connectivity_map_key,
      ),
  )
  const groundSideSourcePort = capacitorSourcePorts.find(
    (sourcePort) =>
      sourcePort.source_port_id !== powerSideSourcePort?.source_port_id &&
      sourcePort.subcircuit_connectivity_map_key !== undefined &&
      sourcePort.subcircuit_connectivity_map_key !==
        powerSideSourcePort?.subcircuit_connectivity_map_key &&
      groundConnectivityMapKeys.has(sourcePort.subcircuit_connectivity_map_key),
  )

  if (!powerSideSourcePort || !groundSideSourcePort) return

  db.source_component.update(capacitor.source_component_id, {
    max_decoupling_trace_length: DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM,
  })

  const capacitorSourcePortIds = new Set(
    capacitorSourcePorts.map((sourcePort) => sourcePort.source_port_id),
  )
  for (const sourceTrace of db.source_trace.list()) {
    if (
      !sourceTrace.connected_source_port_ids.some((sourcePortId) =>
        capacitorSourcePortIds.has(sourcePortId),
      )
    ) {
      continue
    }

    db.source_trace.update(sourceTrace.source_trace_id, {
      max_length: Math.min(
        sourceTrace.max_length ?? DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM,
        DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM,
      ),
    })
  }
}
