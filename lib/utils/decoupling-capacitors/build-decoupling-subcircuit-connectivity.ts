import type { Net } from "lib/components/primitive-components/Net"
import type { Port } from "lib/components/primitive-components/Port"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { TraceConnectionError } from "lib/errors"
import { chipPortShouldHaveDecouplingCapacitor } from "./chip-port-should-have-decoupling-capacitor"
import { portIsGround } from "./port-is-ground"

export interface DecouplingPortConnectivity {
  connectedPorts: ReadonlySet<Port>
  connectedNets: ReadonlySet<Net>
}

export interface DecouplingNetCharacteristics {
  hasChipPowerPort: boolean
  hasGroundPort: boolean
}

export interface DecouplingSubcircuitConnectivity {
  portConnectivityByPort: ReadonlyMap<Port, DecouplingPortConnectivity>
  netCharacteristicsByNet: ReadonlyMap<Net, DecouplingNetCharacteristics>
}

interface MutableDecouplingPortConnectivity {
  connectedPorts: Set<Port>
  connectedNets: Set<Net>
}

function getOrCreatePortConnectivity(
  portConnectivityByPort: Map<Port, MutableDecouplingPortConnectivity>,
  connectedPort: Port,
): MutableDecouplingPortConnectivity {
  const existingPortConnectivity = portConnectivityByPort.get(connectedPort)
  if (existingPortConnectivity) return existingPortConnectivity

  const newPortConnectivity = {
    connectedPorts: new Set<Port>(),
    connectedNets: new Set<Net>(),
  }
  portConnectivityByPort.set(connectedPort, newPortConnectivity)
  return newPortConnectivity
}

function getOrCreatePortsConnectedToNet(
  portsConnectedToNet: Map<Net, Set<Port>>,
  connectedNet: Net,
): Set<Port> {
  const existingConnectedPorts = portsConnectedToNet.get(connectedNet)
  if (existingConnectedPorts) return existingConnectedPorts

  const newConnectedPorts = new Set<Port>()
  portsConnectedToNet.set(connectedNet, newConnectedPorts)
  return newConnectedPorts
}

function getConnectedTracePorts(trace: Trace): Port[] | undefined {
  try {
    return trace._findConnectedPorts().ports ?? []
  } catch (error) {
    if (error instanceof TraceConnectionError) return undefined
    throw error
  }
}

function getConnectedTraceNets(trace: Trace): Net[] {
  const connectedTraceNets: Net[] = []
  for (const connectedNet of trace._findConnectedNets().nets) {
    if (connectedNet) connectedTraceNets.push(connectedNet)
  }
  return connectedTraceNets
}

function recordTraceConnectivity(
  connectedTracePorts: Port[],
  connectedTraceNets: Net[],
  portConnectivityByPort: Map<Port, MutableDecouplingPortConnectivity>,
  portsConnectedToNet: Map<Net, Set<Port>>,
): void {
  for (const connectedTracePort of connectedTracePorts) {
    const portConnectivity = getOrCreatePortConnectivity(
      portConnectivityByPort,
      connectedTracePort,
    )

    for (const otherConnectedTracePort of connectedTracePorts) {
      if (otherConnectedTracePort !== connectedTracePort) {
        portConnectivity.connectedPorts.add(otherConnectedTracePort)
      }
    }

    for (const connectedTraceNet of connectedTraceNets) {
      portConnectivity.connectedNets.add(connectedTraceNet)
      getOrCreatePortsConnectedToNet(
        portsConnectedToNet,
        connectedTraceNet,
      ).add(connectedTracePort)
    }
  }
}

export function getDecouplingConnectionCharacteristicsForPorts(
  connectedPorts: ReadonlySet<Port>,
): DecouplingNetCharacteristics {
  let hasChipPowerPort = false
  let hasGroundPort = false

  for (const connectedPort of connectedPorts) {
    hasChipPowerPort ||= chipPortShouldHaveDecouplingCapacitor(connectedPort)
    hasGroundPort ||= portIsGround(connectedPort)
    if (hasChipPowerPort && hasGroundPort) break
  }

  return { hasChipPowerPort, hasGroundPort }
}

function summarizeNetCharacteristics(
  portsConnectedToNet: ReadonlyMap<Net, ReadonlySet<Port>>,
): Map<Net, DecouplingNetCharacteristics> {
  const netCharacteristicsByNet = new Map<Net, DecouplingNetCharacteristics>()
  for (const [connectedNet, connectedPorts] of portsConnectedToNet) {
    netCharacteristicsByNet.set(
      connectedNet,
      getDecouplingConnectionCharacteristicsForPorts(connectedPorts),
    )
  }
  return netCharacteristicsByNet
}

/** Builds the reusable port and net graph used to classify decoupling caps. */
export function buildDecouplingSubcircuitConnectivity(
  subcircuitTraces: Trace[],
): DecouplingSubcircuitConnectivity {
  const portConnectivityByPort = new Map<
    Port,
    MutableDecouplingPortConnectivity
  >()
  const portsConnectedToNet = new Map<Net, Set<Port>>()

  for (const subcircuitTrace of subcircuitTraces) {
    const connectedTracePorts = getConnectedTracePorts(subcircuitTrace)
    if (!connectedTracePorts) continue

    recordTraceConnectivity(
      connectedTracePorts,
      getConnectedTraceNets(subcircuitTrace),
      portConnectivityByPort,
      portsConnectedToNet,
    )
  }

  return {
    portConnectivityByPort,
    netCharacteristicsByNet: summarizeNetCharacteristics(portsConnectedToNet),
  }
}
