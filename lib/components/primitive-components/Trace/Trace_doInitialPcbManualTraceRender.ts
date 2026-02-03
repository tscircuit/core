import type { LayerRef, PcbTraceRoutePoint } from "circuit-json"
import { getTraceLength } from "./trace-utils/compute-trace-length"
import type { Port } from "../Port"
import type { Trace } from "./Trace"
import { applyToPoint, identity } from "transformation-matrix"
import { clipTraceEndAtPad } from "../../../utils/trace-clipping/clipTraceEndAtPad"
import { getViaDiameterDefaults } from "../../../utils/pcbStyle/getViaDiameterDefaults"

export function Trace_doInitialPcbManualTraceRender(trace: Trace) {
  if (trace.root?.pcbDisabled) return
  const { db } = trace.root!
  const { _parsedProps: props } = trace
  const subcircuit = trace.getSubcircuit()

  const hasPcbPath = props.pcbPath !== undefined
  const wantsStraightLine = Boolean(props.pcbStraightLine)

  if (!hasPcbPath && !wantsStraightLine) return

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

  const width =
    trace._getExplicitTraceThickness() ??
    trace.getSubcircuit()._parsedProps.minTraceWidth ??
    0.16

  if (wantsStraightLine && !hasPcbPath) {
    if (!ports || ports.length < 2) {
      trace.renderError("pcbStraightLine requires exactly two connected ports")
      return
    }

    const [startPort, endPort] = ports
    const startLayers = startPort.getAvailablePcbLayers()
    const endLayers = endPort.getAvailablePcbLayers()
    const sharedLayer = startLayers.find((layer) => endLayers.includes(layer))
    const layer = (sharedLayer ??
      startLayers[0] ??
      endLayers[0] ??
      "top") as LayerRef

    const startPos = startPort._getGlobalPcbPositionAfterLayout()
    const endPos = endPort._getGlobalPcbPositionAfterLayout()

    // Clip trace endpoints at pad edges when trace is too wide
    const clippedStartPos = clipTraceEndAtPad({
      traceStart: endPos,
      traceEnd: startPos,
      traceWidth: width,
      port: startPort,
    })
    const clippedEndPos = clipTraceEndAtPad({
      traceStart: startPos,
      traceEnd: endPos,
      traceWidth: width,
      port: endPort,
    })

    const route: PcbTraceRoutePoint[] = [
      {
        route_type: "wire",
        x: clippedStartPos.x,
        y: clippedStartPos.y,
        width,
        layer,
        start_pcb_port_id: startPort.pcb_port_id!,
      },
      {
        route_type: "wire",
        x: clippedEndPos.x,
        y: clippedEndPos.y,
        width,
        layer,
        end_pcb_port_id: endPort.pcb_port_id!,
      },
    ]

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
    return
  }

  if (!props.pcbPath) return

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
  let currentLayer = layer as LayerRef

  const anchorPos = anchorPort._getGlobalPcbPositionAfterLayout()
  const otherPos = otherPort._getGlobalPcbPositionAfterLayout()

  const route: PcbTraceRoutePoint[] = []
  route.push({
    route_type: "wire",
    x: anchorPos.x,
    y: anchorPos.y,
    width,
    layer: currentLayer,
    start_pcb_port_id: anchorPort.pcb_port_id!,
  })
  const transform =
    anchorPort?._computePcbGlobalTransformBeforeLayout?.() || identity()
  for (const pt of props.pcbPath) {
    let coordinates: { x: number; y: number }
    let isGlobalPosition = false
    const isViaPoint = typeof pt !== "string" && pt.via
    let viaFromLayer: LayerRef | undefined
    let viaToLayer: LayerRef | undefined

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
      if (pt.via) {
        viaFromLayer = (pt.fromLayer ?? currentLayer) as LayerRef
        viaToLayer = pt.toLayer as LayerRef
      }
    }

    // Only apply transform to relative coordinates, not global positions
    const finalCoordinates = isGlobalPosition
      ? coordinates
      : applyToPoint(transform, coordinates)

    if (isViaPoint) {
      route.push({
        route_type: "via",
        x: finalCoordinates.x,
        y: finalCoordinates.y,
        from_layer: viaFromLayer ?? currentLayer,
        to_layer: viaToLayer ?? currentLayer,
      })
      currentLayer = (viaToLayer ?? currentLayer) as LayerRef
    } else {
      route.push({
        route_type: "wire",
        x: finalCoordinates.x,
        y: finalCoordinates.y,
        width,
        layer: currentLayer,
      })
    }
  }
  route.push({
    route_type: "wire",
    x: otherPos.x,
    y: otherPos.y,
    width,
    layer: currentLayer,
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
  const pcbStyle = trace.getInheritedMergedProperty("pcbStyle")
  const { holeDiameter, padDiameter } = getViaDiameterDefaults(pcbStyle)
  for (const point of route) {
    if (point.route_type === "via") {
      db.pcb_via.insert({
        pcb_trace_id: pcb_trace.pcb_trace_id,
        x: point.x,
        y: point.y,
        hole_diameter: holeDiameter,
        outer_diameter: padDiameter,
        layers: [point.from_layer as LayerRef, point.to_layer as LayerRef],
        from_layer: point.from_layer as LayerRef,
        to_layer: point.to_layer as LayerRef,
      })
    }
  }
  trace._portsRoutedOnPcb = ports
  trace.pcb_trace_id = pcb_trace.pcb_trace_id
  trace._insertErrorIfTraceIsOutsideBoard(route, ports)
}
