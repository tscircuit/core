import type { LayerRef, PcbTraceRoutePoint } from "circuit-json"
import { getTraceLength } from "./trace-utils/compute-trace-length"
import type { Port } from "../Port"
import type { Trace } from "./Trace"
import { applyToPoint, identity } from "transformation-matrix"

export function Trace_doInitialPcbManualTraceRender(trace: Trace) {
  Trace_renderPcbManualTrace(trace)
}

export function Trace_updatePcbManualTraceRender(trace: Trace) {
  Trace_renderPcbManualTrace(trace)
}

function Trace_renderPcbManualTrace(trace: Trace) {
  if (trace.root?.pcbDisabled) return
  const { db } = trace.root!
  const { _parsedProps: props } = trace
  const subcircuit = trace.getSubcircuit()

  if (!props.pcbPath) return

  const { allPortsFound, ports, portsWithSelectors } =
    trace._findConnectedPorts()
  if (!allPortsFound) return

  const portsWithoutMatchedPcbPrimitive: Port[] = []
  for (const port of ports) {
    if (!port._hasMatchedPcbPrimitive()) {
      portsWithoutMatchedPcbPrimitive.push(port)
    }
  }

  if (portsWithoutMatchedPcbPrimitive.length > 0) {
    db.pcb_trace_error.insert({
      error_type: "pcb_trace_error",
      source_trace_id: trace.source_trace_id!,
      message: `Some ports did not have a matching PCB primitive (e.g. a pad or plated hole), this can happen if a footprint is missing. As a result, ${trace} wasn't routed. Missing ports: ${portsWithoutMatchedPcbPrimitive
        .map((p) => p.getString())
        .join(", ")}`,
      pcb_trace_id: trace.pcb_trace_id!,
      pcb_component_ids: [],
      pcb_port_ids: portsWithoutMatchedPcbPrimitive
        .map((p) => p.pcb_port_id!)
        .filter(Boolean),
    })
    return
  }

  let anchorPort: Port | undefined
  if (props.pcbPathRelativeTo) {
    anchorPort = portsWithSelectors.find(
      (p) => p.selector === props.pcbPathRelativeTo,
    )?.port
    if (!anchorPort) {
      anchorPort = trace.getSubcircuit().selectOne(props.pcbPathRelativeTo) as
        | Port
        | undefined
    }
  }
  if (!anchorPort) {
    anchorPort = ports[0]
  }
  const otherPort = ports.find((p) => p !== anchorPort) ?? ports[1]

  const layer = anchorPort.getAvailablePcbLayers()[0] || "top"
  const width =
    trace._getExplicitTraceThickness() ??
    trace.getSubcircuit()._parsedProps.minTraceWidth ??
    0.16

  const anchorPos = anchorPort._getGlobalPcbPositionAfterLayout()
  const otherPos = otherPort._getGlobalPcbPositionAfterLayout()

  const route: PcbTraceRoutePoint[] = []
  route.push({
    route_type: "wire",
    x: anchorPos.x,
    y: anchorPos.y,
    width,
    layer: layer as LayerRef,
    start_pcb_port_id: anchorPort.pcb_port_id!,
  })
  const transform =
    anchorPort?._computePcbGlobalTransformBeforeLayout?.() || identity()
  for (const pt of props.pcbPath) {
    let coordinates: { x: number; y: number }
    let isGlobalPosition = false

    // Check if pt is a string selector
    if (typeof pt === "string") {
      // Resolve the selector to a Port (preprocessSelector handles format conversion)
      const resolvedPort = trace.getSubcircuit().selectOne(pt, {
        type: "port",
      }) as Port | undefined
      if (!resolvedPort) {
        db.pcb_trace_error.insert({
          error_type: "pcb_trace_error",
          source_trace_id: trace.source_trace_id!,
          message: `Could not resolve pcbPath selector "${pt}" for ${trace}`,
          pcb_trace_id: trace.pcb_trace_id!,
          pcb_component_ids: [],
          pcb_port_ids: [],
        })
        continue
      }

      // Get the global position of the resolved port (already in global coordinates)
      const portPos = resolvedPort._getGlobalPcbPositionAfterLayout()
      coordinates = { x: portPos.x, y: portPos.y }
      isGlobalPosition = true
    } else {
      // Use the provided coordinates (these are relative to the anchor point)
      coordinates = { x: pt.x as number, y: pt.y as number }
      isGlobalPosition = false
    }

    // Only apply transform to relative coordinates, not global positions
    const finalCoordinates = isGlobalPosition
      ? coordinates
      : applyToPoint(transform, coordinates)

    route.push({
      route_type: "wire",
      x: finalCoordinates.x,
      y: finalCoordinates.y,
      width,
      layer: layer as LayerRef,
    })
  }
  route.push({
    route_type: "wire",
    x: otherPos.x,
    y: otherPos.y,
    width,
    layer: layer as LayerRef,
    end_pcb_port_id: otherPort.pcb_port_id!,
  })

  const traceLength = getTraceLength(route)
  if (trace.pcb_trace_id) {
    db.pcb_trace.update(trace.pcb_trace_id, {
      route,
      trace_length: traceLength,
    })
  } else {
    const pcb_trace = db.pcb_trace.insert({
      route,
      source_trace_id: trace.source_trace_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
      trace_length: traceLength,
    })
    trace.pcb_trace_id = pcb_trace.pcb_trace_id
  }
  trace._portsRoutedOnPcb = ports
  trace._insertErrorIfTraceIsOutsideBoard(route, ports)
}
