import type {
  PcbPort,
  PcbTrace,
  SourceTrace,
  AnyCircuitElement,
  PcbPortNotConnectedError,
} from "circuit-json"
import { getReadableNameForPcbPort } from "@tscircuit/circuit-json-util"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"

/**
 * Check if each PCB port is connected to PCB traces using the connectivity map.
 */
export function checkEachPcbPortConnectedToPcbTraces(
  circuitJson: AnyCircuitElement[],
): PcbPortNotConnectedError[] {
  const pcbPorts: PcbPort[] = circuitJson.filter(
    (item) => item.type === "pcb_port",
  ) as PcbPort[]

  const pcbTraces: PcbTrace[] = circuitJson.filter(
    (item) => item.type === "pcb_trace",
  ) as PcbTrace[]

  const sourceTraces: SourceTrace[] = circuitJson.filter(
    (item) => item.type === "source_trace",
  ) as SourceTrace[]

  const errors: PcbPortNotConnectedError[] = []

  // Generate the connectivity map from the circuit
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  for (const pcbPort of pcbPorts) {
    // Check if this port's source_port_id is part of any source trace
    const isPartOfSourceTrace = sourceTraces.some((trace) =>
      trace.connected_source_port_ids.includes(pcbPort.source_port_id),
    )

    if (!isPartOfSourceTrace) {
      // Port is not intended to be connected to anything
      continue
    }

    // Get the net ID for this PCB port
    const portNetId = connectivityMap.getNetConnectedToId(pcbPort.pcb_port_id)

    if (!portNetId) {
      // Port is not connected to any net
      errors.push({
        type: "pcb_port_not_connected_error",
        message: `pcb_port_not_connected_error: PCB port ${getReadableNameForPcbPort(circuitJson, pcbPort.pcb_port_id)} is not connected by a PCB trace`,
        error_type: "pcb_port_not_connected_error",
        pcb_port_ids: [pcbPort.pcb_port_id],
        pcb_component_ids: [pcbPort.pcb_component_id],
        pcb_port_not_connected_error_id: `pcb_port_not_connected_error_${pcbPort.pcb_port_id}`,
      })
      continue
    }

    // Find all other PCB ports that should be connected to the same net based on source traces
    const relatedSourceTraces = sourceTraces.filter((trace) =>
      trace.connected_source_port_ids.includes(pcbPort.source_port_id),
    )

    const allRelatedSourcePortIds = new Set<string>()
    for (const trace of relatedSourceTraces) {
      for (const portId of trace.connected_source_port_ids) {
        allRelatedSourcePortIds.add(portId)
      }
    }

    const relatedPcbPorts = pcbPorts.filter(
      (port) =>
        port.pcb_port_id !== pcbPort.pcb_port_id &&
        allRelatedSourcePortIds.has(port.source_port_id),
    )

    if (relatedPcbPorts.length === 0) {
      // This port doesn't need to connect to other ports, so it's fine as long as it has a net
      continue
    }

    // Check if all related PCB ports are in the same net
    const allRelatedPortsInSameNet = relatedPcbPorts.every((relatedPort) => {
      const relatedPortNetId = connectivityMap.getNetConnectedToId(
        relatedPort.pcb_port_id,
      )
      return relatedPortNetId === portNetId
    })

    if (!allRelatedPortsInSameNet) {
      // Some related ports are not in the same net, which means connectivity is broken
      errors.push({
        type: "pcb_port_not_connected_error",
        message: `pcb_port_not_connected_error: PCB port ${getReadableNameForPcbPort(circuitJson, pcbPort.pcb_port_id)} is not connected by a PCB trace`,
        error_type: "pcb_port_not_connected_error",
        pcb_port_ids: [pcbPort.pcb_port_id],
        pcb_component_ids: [pcbPort.pcb_component_id],
        pcb_port_not_connected_error_id: `pcb_port_not_connected_error_${pcbPort.pcb_port_id}`,
      })
      continue
    }

    // If related ports are in the same net, they are connected.
    // Only check for physical traces if there are NO PCB traces at all (autorouting failed completely)
    if (pcbTraces.length === 0) {
      // No PCB traces exist at all - this means autorouting completely failed
      errors.push({
        type: "pcb_port_not_connected_error",
        message: `pcb_port_not_connected_error: PCB port ${getReadableNameForPcbPort(circuitJson, pcbPort.pcb_port_id)} is not connected by a PCB trace`,
        error_type: "pcb_port_not_connected_error",
        pcb_port_ids: [pcbPort.pcb_port_id],
        pcb_component_ids: [pcbPort.pcb_component_id],
        pcb_port_not_connected_error_id: `pcb_port_not_connected_error_${pcbPort.pcb_port_id}`,
      })
    }
  }

  return errors
}

/**
 * Check if ports referenced in source traces are properly connected by PCB traces.
 * This acts as a design rule check to ensure no PCB traces are missing.
 *
 * Algorithm:
 * 1. For each source trace, get all connected source port IDs
 * 2. Find corresponding PCB ports for these source ports
 * 3. Use connectivity map to check if these PCB ports are in the same net
 * 4. If ports should be connected but aren't in the same net, report missing PCB trace
 */
export function checkSourceTracePortsConnectedByPcbTraces(
  circuitJson: AnyCircuitElement[],
): PcbPortNotConnectedError[] {
  const sourceTraces: SourceTrace[] = circuitJson.filter(
    (item) => item.type === "source_trace",
  ) as SourceTrace[]

  const pcbPorts: PcbPort[] = circuitJson.filter(
    (item) => item.type === "pcb_port",
  ) as PcbPort[]

  const errors: PcbPortNotConnectedError[] = []

  // Generate the connectivity map from the circuit
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  // Create a map from source_port_id to pcb_port for quick lookup
  const sourcePortToPcbPort = new Map<string, PcbPort>()
  for (const pcbPort of pcbPorts) {
    sourcePortToPcbPort.set(pcbPort.source_port_id, pcbPort)
  }

  // Process each source trace
  for (const sourceTrace of sourceTraces) {
    const connectedSourcePortIds = sourceTrace.connected_source_port_ids

    // Skip traces with less than 2 ports (nothing to connect)
    if (connectedSourcePortIds.length < 2) {
      continue
    }

    // Find corresponding PCB ports for all source ports in this trace
    const pcbPortsInTrace: PcbPort[] = []
    const missingPcbPorts: string[] = []

    for (const sourcePortId of connectedSourcePortIds) {
      const pcbPort = sourcePortToPcbPort.get(sourcePortId)
      if (pcbPort) {
        pcbPortsInTrace.push(pcbPort)
      } else {
        missingPcbPorts.push(sourcePortId)
      }
    }

    // Skip if we don't have at least 2 PCB ports to connect
    if (pcbPortsInTrace.length < 2) {
      continue
    }

    // Get the net ID for the first PCB port as reference
    const firstPcbPort = pcbPortsInTrace[0]
    const referenceNetId = connectivityMap.getNetConnectedToId(
      firstPcbPort.pcb_port_id,
    )

    // if (disconnectedPorts.length === 0) {
    const netElementIds = connectivityMap.getIdsConnectedToNet(referenceNetId!)
    const pcbTraceIds = netElementIds.filter((id) =>
      circuitJson.some(
        (element) =>
          element.type === "pcb_trace" &&
          (("pcb_trace_id" in element && element.pcb_trace_id === id) ||
            ("route_id" in element && element.route_id === id)),
      ),
    )

    // If no PCB traces are found in this net, it means the connection exists only
    // through other elements (like SMT pads) but not actual traces
    if (pcbTraceIds.length === 0) {
      // Check if this is a trivial case (only 2 ports on same component)
      const uniqueComponentIds = new Set(
        pcbPortsInTrace.map((p) => p.pcb_component_id),
      )

      if (uniqueComponentIds.size > 1) {
        // Ports are on different components but no PCB traces connect them
        errors.push({
          type: "pcb_port_not_connected_error",
          message: `pcb_port_not_connected_error: Ports from source trace ${sourceTrace.source_trace_id} are on different components but no PCB traces found to connect them. Missing PCB traces in net ${referenceNetId}.`,
          error_type: "pcb_port_not_connected_error",
          pcb_port_ids: pcbPortsInTrace.map((p) => p.pcb_port_id),
          pcb_component_ids: pcbPortsInTrace.map((p) => p.pcb_component_id),
          pcb_port_not_connected_error_id: `pcb_port_not_connected_error_trace_${sourceTrace.source_trace_id}`,
        })
      }
    }
  }
  return errors
}
