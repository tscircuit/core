import type { SourcePort, SourceComponentBase } from "circuit-json"
import {
  getSourcePortConnectivityMapFromCircuitJson,
  PcbConnectivityMap,
} from "circuit-json-to-connectivity-map"
import type { SignalIntegrity } from "lib/components/primitive-components/SignalIntegrity"

type SourceComponentId = SourceComponentBase["source_component_id"]
type SourcePortId = SourcePort["source_port_id"]

/** Source connectivity crosses only two-terminal passives away from supply rails. */
export function getSignalTopology(block: SignalIntegrity) {
  const { db } = block.root!
  const circuitJson = db.toArray()
  const copper = getSourcePortConnectivityMapFromCircuitJson(circuitJson)
  const topology = getSourcePortConnectivityMapFromCircuitJson(circuitJson)
  const routed = new PcbConnectivityMap(circuitJson).connMap
  const portsByComponent = new Map<SourceComponentId, SourcePort[]>()
  const ports = db.source_port.list()
  const powerPorts = new Set<SourcePortId>()
  for (const port of ports) {
    if (port.source_component_id) {
      const componentPorts =
        portsByComponent.get(port.source_component_id) ?? []
      componentPorts.push(port)
      portsByComponent.set(port.source_component_id, componentPorts)
    }
    if (
      port.provides_power ||
      port.requires_power ||
      port.provides_ground ||
      port.requires_ground
    )
      powerPorts.add(port.source_port_id)
  }
  for (const model of db.simulation_ibis_model.list()) {
    for (const references of Object.values(
      model.ibis_pin_name_to_reference_source_port_ids ?? {},
    ))
      for (const portId of Object.values(references))
        if (portId) powerPorts.add(portId)
  }
  const powerNets = db.source_net
    .list()
    .filter((net) =>
      /^(?:gnd|ground|vss\w*|vcc\w*|vdd\w*|vbus|[+-]?\d+(?:v\d*)?)$/i.test(
        net.name,
      ),
    )
  const isPowerPort = (port: SourcePort) =>
    powerPorts.has(port.source_port_id) ||
    [...powerPorts].some((powerPortId) =>
      copper.areIdsConnected(port.source_port_id, powerPortId),
    ) ||
    powerNets.some((net) =>
      copper.areIdsConnected(port.source_port_id, net.source_net_id),
    )

  // Keep the source ID in the physical map too, including isolated/unrouted pins.
  for (const pcbPort of db.pcb_port.list())
    routed.addConnections([[pcbPort.source_port_id, pcbPort.pcb_port_id]])

  for (const component of db.source_component.list()) {
    const terminals = portsByComponent.get(component.source_component_id) ?? []
    const isPassive =
      ["simple_resistor", "simple_capacitor", "simple_inductor"].includes(
        component.ftype,
      ) ||
      (terminals.length === 2 && terminals.every((port) => port.is_passive))
    if (!isPassive || terminals.length !== 2 || terminals.some(isPowerPort))
      continue
    const terminalIds = terminals.map((port) => port.source_port_id)
    topology.addConnections([terminalIds])
    routed.addConnections([terminalIds])
  }
  const connected = (a: SourcePortId, b: SourcePortId) =>
    a === b || topology.areIdsConnected(a, b)
  return { connected, routed, ports, portsByComponent }
}
