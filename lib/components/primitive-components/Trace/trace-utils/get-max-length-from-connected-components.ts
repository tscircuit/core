import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { CapacitorConnection, TraceMaxLengthOrigin } from "circuit-json"
import type { Capacitor } from "../../../normal-components/Capacitor"
import type { Chip } from "../../../normal-components/Chip"
import { Port } from "../../Port"
import { portShouldHaveDecouplingCapacitor } from "../../Port/Port_isConnectedToPower"
import { portIsGround } from "../../Port/Port_isConnectedToGround"

export interface CapacitorTraceConstraint {
  max_length?: number
  max_length_origin?: TraceMaxLengthOrigin
  capacitor_connection: CapacitorConnection
}

/** Identify a local capacitor/IC relationship. Sharing a rail, touching another
 * capacitor, or terminating at a named net cannot identify a local IC path. */
export const getCapacitorTraceConstraint = (
  ports: Port[],
  { db }: { db: CircuitJsonUtilObjects },
): CapacitorTraceConstraint | undefined => {
  if (ports.length !== 2) return
  const capacitorPort = ports.find(
    (port) =>
      port.getParentNormalComponent()?.config.componentName === "Capacitor",
  )
  if (!capacitorPort) return
  const capacitor: Capacitor = capacitorPort.getParentNormalComponent()!
  const icPort = ports.find((port) => port !== capacitorPort)!
  const ic: Chip | null = icPort.getParentNormalComponent()
  if (ic?.config.componentName !== "Chip") return

  const capacitorPorts = capacitor.children.filter(
    (child): child is Port => child instanceof Port,
  )
  if (capacitorPorts.length !== 2) return
  const otherCapacitorPort = capacitorPorts.find(
    (port) => port !== capacitorPort,
  )!
  const connectedIcPorts = otherCapacitorPort
    ._getDirectlyConnectedTraces()
    .flatMap((trace) => {
      const connectedPorts = trace._findConnectedPorts().ports ?? []
      if (connectedPorts.length !== 2) return []
      return connectedPorts.filter(
        (port) => port.getParentNormalComponent() === ic,
      )
    })
  const isSupply = portShouldHaveDecouplingCapacitor(icPort)
  const isReturn = portIsGround(icPort)
  if (isSupply === isReturn) return
  if (isSupply && !otherCapacitorPort.isConnectedToGround()) return
  if (isReturn && connectedIcPorts.length === 0) return

  const sourceCapacitor = db.source_component.get(
    capacitor.source_component_id!,
  )
  if (sourceCapacitor?.ftype !== "simple_capacitor") return
  const hasDecouplingTopology =
    isSupply || connectedIcPorts.some(portShouldHaveDecouplingCapacitor)
  const role =
    sourceCapacitor.capacitor_role ??
    (sourceCapacitor.max_decoupling_trace_length_origin === "automatic" &&
    hasDecouplingTopology
      ? "decoupling"
      : "unspecified")
  const capacitor_connection: CapacitorConnection = {
    capacitor_source_component_id: sourceCapacitor.source_component_id,
    capacitor_source_port_id: capacitorPort.source_port_id!,
    associated_source_component_id: ic.source_component_id!,
    associated_source_port_id: icPort.source_port_id!,
    connection_type: isSupply ? "supply" : "return",
    capacitor_role: role,
  }
  // Declared non-decoupling roles need their own layout rules. Authored trace
  // maxLength remains independent and is handled by the caller.
  if (role !== "decoupling" && role !== "unspecified")
    return { capacitor_connection }
  const maximum = sourceCapacitor.max_decoupling_trace_length
  const configured =
    sourceCapacitor.max_decoupling_trace_length_origin === "configured"
  if (maximum === undefined || (!configured && !hasDecouplingTopology))
    return { capacitor_connection }
  return {
    max_length: maximum,
    max_length_origin: configured
      ? "configured_capacitor"
      : sourceCapacitor.max_decoupling_trace_length_origin === "automatic"
        ? "inferred_decoupling"
        : undefined,
    capacitor_connection,
  }
}

export const getMaxLengthFromConnectedComponents = (
  ports: Port[],
  context: { db: CircuitJsonUtilObjects },
): number | undefined => getCapacitorTraceConstraint(ports, context)?.max_length
