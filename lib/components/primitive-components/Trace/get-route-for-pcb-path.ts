import type { PcbPath } from "@tscircuit/props"
import type { LayerRef, PcbTrace, PcbTraceRoutePoint } from "circuit-json"
import { applyToPoint, identity } from "transformation-matrix"
import type { Port } from "../Port"
import { getPcbSelectorErrorForTracePort } from "./getPcbSelectorErrorForTracePort"
import type { Trace } from "./Trace"

interface GetRouteForPcbPathInput {
  trace: Trace
  path: PcbPath
  anchorPort: Port
  width: number
}

/**
 * Numeric path entries are points in a right-handed local PCB frame measured
 * in millimetres (+X right, +Y top), so the local-to-board transform includes
 * translation. The local frame belongs to the anchor footprint, or to the
 * containing subcircuit for inflated Circuit JSON. Selector entries are
 * already points in the right-handed board-world frame and remain unchanged.
 */
export const getRouteForPcbPath = ({
  trace,
  path,
  anchorPort,
  width,
}: GetRouteForPcbPathInput): PcbTraceRoutePoint[] | undefined => {
  const { db } = trace.root!
  const subcircuit = trace.getSubcircuit()
  const pcbPathLocalToBoardTransform = subcircuit._isInflatedFromCircuitJson
    ? trace._computePcbGlobalTransformBeforeLayout()
    : (anchorPort._computePcbGlobalTransformBeforeLayout?.() ?? identity())
  let currentLayer = (anchorPort.getAvailablePcbLayers()[0] ??
    "top") as LayerRef
  const route: PcbTraceRoutePoint[] = []

  for (const [index, point] of path.entries()) {
    if (typeof point === "string") {
      const resolvedPort = subcircuit.selectOne(point, { type: "port" }) as
        | Port
        | undefined
      if (!resolvedPort) {
        db.pcb_trace_error.insert({
          error_type: "pcb_trace_error",
          source_trace_id: trace.source_trace_id!,
          message: `Could not resolve pcbPaths selector "${point}" for ${trace}`,
          pcb_trace_id: trace.pcb_trace_id!,
          pcb_component_ids: [],
          pcb_port_ids: [],
        })
        return
      }
      const pcbTargetError = getPcbSelectorErrorForTracePort(
        point,
        resolvedPort,
      )
      if (pcbTargetError) {
        db.pcb_trace_error.insert({
          error_type: "pcb_trace_error",
          source_trace_id: trace.source_trace_id!,
          message: pcbTargetError,
          pcb_trace_id: trace.pcb_trace_id!,
          pcb_component_ids: [],
          pcb_port_ids: [],
        })
        return
      }
      if (index === 0) {
        currentLayer = (resolvedPort.getAvailablePcbLayers()[0] ??
          currentLayer) as LayerRef
      }
      const position = resolvedPort._getGlobalPcbPositionAfterLayout()
      route.push({
        route_type: "wire",
        x: position.x,
        y: position.y,
        width,
        layer: currentLayer,
        ...(index === 0
          ? { start_pcb_port_id: resolvedPort.pcb_port_id! }
          : {}),
        ...(index === path.length - 1
          ? { end_pcb_port_id: resolvedPort.pcb_port_id! }
          : {}),
      })
      continue
    }

    const position = applyToPoint(pcbPathLocalToBoardTransform, {
      x: point.x as number,
      y: point.y as number,
    })
    if (point.via) {
      const fromLayer = (point.fromLayer ?? currentLayer) as LayerRef
      const toLayer = (point.toLayer ?? currentLayer) as LayerRef
      route.push({
        route_type: "via",
        x: position.x,
        y: position.y,
        from_layer: fromLayer,
        to_layer: toLayer,
      })
      currentLayer = toLayer
    } else {
      route.push({
        route_type: "wire",
        x: position.x,
        y: position.y,
        width,
        layer: currentLayer,
      })
    }
  }

  return route
}

/**
 * Report barrel contact errors for board-world route points, in mm (+X right,
 * +Y up, right-handed). Error centers are points at the invalid vias. Preserve
 * the saved copper and associate each error with its rendered PCB trace.
 * PCB vias follow their occurrence order in the rendered trace's route.
 */
export const insertPcbPathViaContactErrors = (
  trace: Trace,
  pcbTrace: PcbTrace,
  ports: Port[],
  pathIndex?: number,
): void => {
  const { db } = trace.root!
  const pcbVias = db.pcb_via.list({ pcb_trace_id: pcbTrace.pcb_trace_id })
  const connection = db.source_trace.get(trace.source_trace_id!)?.display_name
  const traceDescription = connection
    ? trace._parsedProps.name
      ? `${trace.getDisplayName()}, ${connection}`
      : connection
    : trace._parsedProps.name
      ? trace.getDisplayName()
      : "unnamed trace"
  const pathName =
    pathIndex === undefined ? "pcbPath" : `pcbPaths[${pathIndex}]`
  let incomingLayer: LayerRef | undefined
  let viaNumber = 0
  for (const point of pcbTrace.route) {
    if (point.route_type === "wire") incomingLayer = point.layer
    if (point.route_type !== "via") continue
    viaNumber++
    const layers = pcbVias[viaNumber - 1]!.layers
    if (incomingLayer && !layers.includes(incomingLayer)) {
      db.pcb_trace_error.insert({
        error_type: "pcb_trace_error",
        source_trace_id: trace.source_trace_id!,
        message: `Invalid ${pathName} (${traceDescription}): via ${viaNumber} (${point.from_layer} → ${point.to_layer}) at board (${Number(point.x.toFixed(4))}, ${Number(point.y.toFixed(4))}) mm does not reach incoming ${incomingLayer} copper.`,
        center: { x: point.x, y: point.y },
        pcb_trace_id: pcbTrace.pcb_trace_id,
        pcb_component_ids: [],
        pcb_port_ids: ports.map((port) => port.pcb_port_id!).filter(Boolean),
        subcircuit_id: pcbTrace.subcircuit_id,
        is_fatal: false,
      })
    }
    incomingLayer = point.to_layer
  }
}
