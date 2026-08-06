import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import {
  GROUND_NET_REGEX,
  POWER_NET_REGEX,
} from "lib/utils/gnd-power-net-regex"
import type { Net } from "../../primitive-components/Net"
import type { Port } from "../../primitive-components/Port"
import type { Trace } from "../../primitive-components/Trace/Trace"
import type { Capacitor } from "../Capacitor"

const DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM = 1

const isEligibleChipPowerInputPort = (
  port: Port,
  db: CircuitJsonUtilObjects,
): boolean => {
  if (port.getParentNormalComponent()?.componentName !== "Chip") return false

  const sourcePort = db.source_port.get(port.source_port_id!)
  if (sourcePort?.should_have_decoupling_capacitor !== undefined) {
    return sourcePort.should_have_decoupling_capacitor
  }
  if (sourcePort?.provides_power === true) return false
  if (sourcePort?.requires_power !== undefined) {
    return sourcePort.requires_power
  }

  return port.getNameAndAliases().some((name) => POWER_NET_REGEX.test(name))
}

const isGroundPort = (port: Port, db: CircuitJsonUtilObjects): boolean => {
  const sourcePort = db.source_port.get(port.source_port_id!)
  if (sourcePort?.requires_ground === true) return true
  if (sourcePort?.provides_ground === true) return true

  return port.getNameAndAliases().some((name) => GROUND_NET_REGEX.test(name))
}

const isGroundNet = (net: Net, db: CircuitJsonUtilObjects): boolean => {
  const sourceNet = db.source_net.get(net.source_net_id!)
  return sourceNet?.is_ground === true || GROUND_NET_REGEX.test(net.props.name)
}

const getDirectlyConnectedTraces = (
  capacitor: Capacitor,
  capacitorPort: Port,
): Trace[] => {
  const traces = capacitor.getSubcircuit().selectAll("trace") as Trace[]

  return traces.filter((trace) => {
    try {
      const connectedPorts = trace._findConnectedPorts()
      return (
        connectedPorts.allPortsFound &&
        connectedPorts.ports.includes(capacitorPort)
      )
    } catch {
      return false
    }
  })
}

const getDirectChipPowerTraces = (
  capacitor: Capacitor,
  capacitorPort: Port,
  db: CircuitJsonUtilObjects,
): Trace[] =>
  getDirectlyConnectedTraces(capacitor, capacitorPort).filter((trace) => {
    const connectedPorts = trace._findConnectedPorts()
    return (
      connectedPorts.allPortsFound &&
      connectedPorts.ports.some(
        (port) =>
          port !== capacitorPort && isEligibleChipPowerInputPort(port, db),
      )
    )
  })

const hasDirectGroundConnection = (
  capacitor: Capacitor,
  capacitorPort: Port,
  db: CircuitJsonUtilObjects,
): boolean =>
  getDirectlyConnectedTraces(capacitor, capacitorPort).some((trace) => {
    const connectedPorts = trace._findConnectedPorts()
    if (
      connectedPorts.allPortsFound &&
      connectedPorts.ports.some(
        (port) => port !== capacitorPort && isGroundPort(port, db),
      )
    ) {
      return true
    }

    return trace._findConnectedNets().nets.some((net) => isGroundNet(net, db))
  })

export const getAutomaticDecouplingTraceConstraint = (
  capacitor: Capacitor,
): { maxLength: number; powerTraces: Trace[] } | undefined => {
  const ports = capacitor.children.filter(
    (child): child is Port => child.componentName === "Port",
  )
  if (ports.length !== 2) return undefined

  const { db } = capacitor.root!
  const [firstPort, secondPort] = ports
  const firstPowerTraces = getDirectChipPowerTraces(capacitor, firstPort, db)
  if (
    firstPowerTraces.length > 0 &&
    hasDirectGroundConnection(capacitor, secondPort, db)
  ) {
    return {
      maxLength: DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM,
      powerTraces: firstPowerTraces,
    }
  }

  const secondPowerTraces = getDirectChipPowerTraces(capacitor, secondPort, db)
  if (
    secondPowerTraces.length > 0 &&
    hasDirectGroundConnection(capacitor, firstPort, db)
  ) {
    return {
      maxLength: DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM,
      powerTraces: secondPowerTraces,
    }
  }

  return undefined
}
