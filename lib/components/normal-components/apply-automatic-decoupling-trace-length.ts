import type { SourcePort } from "circuit-json"
import type { SubcircuitConnectivityMapKey } from "lib/utils/circuit-json/subcircuit-connectivity-map-key"
import type { Capacitor } from "./Capacitor"
import { chipSourcePortShouldHaveDecouplingCapacitor } from "./chip-source-port-should-have-decoupling-capacitor"
import { sourcePortIsGround } from "./source-port-is-ground"

const DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM = 1

/**
 * Detects a capacitor bridging a chip power pin and ground, then applies the
 * default decoupling trace limit to the capacitor and its attached traces.
 * Explicit maxDecouplingTraceLength values and unrelated capacitors are left
 * unchanged.
 */
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
  const capacitorSourcePorts: SourcePort[] = []
  const chipPowerConnectivityMapKeys = new Set<SubcircuitConnectivityMapKey>()
  const groundConnectivityMapKeys = new Set<SubcircuitConnectivityMapKey>()

  for (const sourcePort of allSourcePorts) {
    if (sourcePort.source_component_id === capacitor.source_component_id) {
      capacitorSourcePorts.push(sourcePort)
    }

    const connectivityMapKey = sourcePort.subcircuit_connectivity_map_key
    if (!connectivityMapKey) continue

    const sourcePortParent = sourcePort.source_component_id
      ? db.source_component.get(sourcePort.source_component_id)
      : undefined
    const sourcePortParentIsChip =
      sourcePortParent !== null &&
      sourcePortParent !== undefined &&
      "ftype" in sourcePortParent &&
      sourcePortParent.ftype === "simple_chip"
    if (
      chipSourcePortShouldHaveDecouplingCapacitor(
        sourcePort,
        sourcePortParentIsChip,
      )
    ) {
      chipPowerConnectivityMapKeys.add(connectivityMapKey)
    }
    if (sourcePortIsGround(sourcePort)) {
      groundConnectivityMapKeys.add(connectivityMapKey)
    }
  }

  for (const sourceNet of db.source_net.list()) {
    if (sourceNet.is_ground && sourceNet.subcircuit_connectivity_map_key) {
      groundConnectivityMapKeys.add(sourceNet.subcircuit_connectivity_map_key)
    }
  }

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
      sourceTrace.max_length !== undefined ||
      !sourceTrace.connected_source_port_ids.some((sourcePortId) =>
        capacitorSourcePortIds.has(sourcePortId),
      )
    ) {
      continue
    }

    db.source_trace.update(sourceTrace.source_trace_id, {
      max_length: DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM,
    })
  }
}
