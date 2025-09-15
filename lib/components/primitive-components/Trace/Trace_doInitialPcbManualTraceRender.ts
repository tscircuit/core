import type { LayerRef, PcbTraceRoutePoint } from "circuit-json"
import { getTraceLength } from "./trace-utils/compute-trace-length"
import type { Port } from "../Port"
import type { Trace } from "./Trace"
import { applyToPoint, identity } from "transformation-matrix"

export function Trace_doInitialPcbManualTraceRender(trace: Trace) {
  if (trace.root?.pcbDisabled) return
  const { db } = trace.root!
  const { _parsedProps: props } = trace
  const subcircuit = trace.getSubcircuit()

  if (!props.pcbPath || props.pcbPath.length === 0) return

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
    props.thickness ?? trace.getSubcircuit()._parsedProps.minTraceWidth ?? 0.16

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
    const transformed = applyToPoint(transform, {
      x: pt.x as number,
      y: pt.y as number,
    })
    route.push({
      route_type: "wire",
      x: transformed.x,
      y: transformed.y,
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
  const pcb_trace = db.pcb_trace.insert({
    route,
    source_trace_id: trace.source_trace_id!,
    subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
    trace_length: traceLength,
  })
  trace._portsRoutedOnPcb = ports
  trace.pcb_trace_id = pcb_trace.pcb_trace_id
  trace._insertErrorIfTraceIsOutsideBoard(route, ports)
}
