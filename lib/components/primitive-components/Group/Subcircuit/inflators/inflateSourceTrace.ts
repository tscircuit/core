import type {
  LayerRef,
  PcbTrace,
  PcbTraceRoutePoint,
  SourceTrace,
} from "circuit-json"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import {
  type ManualPcbPathPoint,
  pcbTraceRouteToPcbPath,
} from "lib/utils/pcbTraceRouteToPcbPath"
import type { InflatorContext } from "../InflatorFn"

const getSelectorPath = (
  component: { name: string; source_group_id: string | undefined },
  inflatorContext: InflatorContext,
): string => {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext
  const path_parts: string[] = []
  let currentGroupId = component.source_group_id
  while (currentGroupId && currentGroupId !== subcircuit.source_group_id) {
    const sourceGroup = injectionDb.source_group.get(currentGroupId)
    const groupInstance = groupsMap?.get(currentGroupId)
    if (!sourceGroup || !groupInstance) break

    // The group instance may not have been rendered, so its ".name"
    // getter can fail. We reconstruct the name from its props or
    // its fallback.
    const groupName =
      groupInstance.props.name ?? groupInstance.fallbackUnassignedName

    path_parts.unshift(`.${groupName}`)
    currentGroupId = sourceGroup.parent_source_group_id
  }
  path_parts.push(`.${component.name}`)
  return path_parts.join(" > ")
}

export function inflateSourceTrace(
  sourceTrace: SourceTrace,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit } = inflatorContext

  const connectedSelectors: string[] = []

  // Get selectors for connected ports
  for (const sourcePortId of sourceTrace.connected_source_port_ids) {
    const sourcePort = injectionDb.source_port.get(sourcePortId)
    if (!sourcePort) {
      continue
    }

    let selector: string | undefined
    if (sourcePort.source_component_id) {
      const sourceComponent = injectionDb.source_component.get(
        sourcePort.source_component_id,
      )
      if (sourceComponent) {
        // This is a port on a component, e.g. .G1 > .R1 > .pin1
        const path = getSelectorPath(
          {
            name: sourceComponent.name,
            source_group_id: sourceComponent.source_group_id,
          },
          inflatorContext,
        )
        selector = `${path} > .${sourcePort.name}`
      }
    } else {
      // This is a port on a group, usually the root group of the subcircuit.
      // e.g. .P1
      selector = `.${sourcePort.name}`
    }

    if (selector) {
      connectedSelectors.push(selector)
    }
  }

  // Get selectors for connected nets
  for (const sourceNetId of sourceTrace.connected_source_net_ids) {
    const sourceNet = injectionDb.source_net.get(sourceNetId)
    if (sourceNet) {
      connectedSelectors.push(`net.${sourceNet.name}`)
    }
  }

  if (connectedSelectors.length < 2) {
    return
  }

  const pcbTrace = injectionDb.pcb_trace.getWhere({
    source_trace_id: sourceTrace.source_trace_id,
  })

  let pcbPath: ManualPcbPathPoint[] | undefined
  if (pcbTrace) {
    pcbPath = pcbTraceRouteToPcbPath(pcbTrace.route)
  }

  // Extract trace width from source_trace or pcb_trace route points
  let traceWidth: number | undefined = sourceTrace.min_trace_thickness
  if (!traceWidth && pcbTrace?.route) {
    // Try to get width from the first wire point in the route
    const wirePoint = pcbTrace.route.find((pt) => pt.route_type === "wire")
    if (wirePoint && wirePoint.route_type === "wire") {
      traceWidth = wirePoint.width
    }
  }

  const traceProps: {
    path: string[]
    pcbPath?: ManualPcbPathPoint[]
    pcbStraightLine?: boolean
    thickness?: number
  } = {
    path: connectedSelectors,
  }

  if (traceWidth !== undefined) {
    traceProps.thickness = traceWidth
  }

  // If pcbPath has intermediate points, use manual routing
  // Otherwise, use straight-line routing (simple 2-point traces)
  if (pcbPath && pcbPath.length > 0) {
    traceProps.pcbPath = pcbPath
  } else if (pcbTrace) {
    // Simple trace with no intermediate points - use straight line
    traceProps.pcbStraightLine = true
  }

  const trace = new Trace(traceProps)

  subcircuit.add(trace)
}
