import type { PcbTrace, PcbVia, SourceTrace } from "circuit-json"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
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

  const pcbTraces = injectionDb.pcb_trace
    .list()
    .filter(
      (pcbTrace) => pcbTrace.source_trace_id === sourceTrace.source_trace_id,
    )

  const inflatedPcbVias: PcbVia[] | undefined =
    pcbTraces.length > 0
      ? injectionDb.pcb_via
          .list()
          .filter((via) =>
            pcbTraces.some(
              (pcbTrace) => pcbTrace.pcb_trace_id === via.pcb_trace_id,
            ),
          )
      : undefined

  // Extract trace width from source_trace or the first imported pcb_trace route
  let traceWidth: number | undefined = sourceTrace.min_trace_thickness
  if (!traceWidth) {
    for (const pcbTrace of pcbTraces) {
      const wirePoint = pcbTrace.route.find((pt) => pt.route_type === "wire")
      if (wirePoint && wirePoint.route_type === "wire") {
        traceWidth = wirePoint.width
        break
      }
    }
  }

  const traceProps: {
    path: string[]
    pcbStraightLine?: boolean
    thickness?: number
  } = {
    path: connectedSelectors,
  }

  if (traceWidth !== undefined) {
    traceProps.thickness = traceWidth
  }

  if (
    pcbTraces.length === 0 &&
    sourceTrace.connected_source_port_ids.length === 2 &&
    sourceTrace.connected_source_net_ids.length === 0
  ) {
    // If the injected JSON has no routed pcb_trace, preserve the logical
    // connection by letting the manual trace phase create a direct PCB trace.
    traceProps.pcbStraightLine = true
  }

  const trace = new Trace(traceProps)
  trace.source_trace_id = sourceTrace.source_trace_id
  trace._isInflatedFromSourceTrace = true
  trace._inflatedPcbTraces = pcbTraces.length > 0 ? pcbTraces : undefined
  trace._inflatedPcbVias = inflatedPcbVias

  subcircuit.add(trace)
}
