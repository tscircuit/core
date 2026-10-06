import type { PcbPath } from "@tscircuit/props"
import type { LayerRef, PcbTraceRoutePoint } from "circuit-json"
import { applyToPoint, identity } from "transformation-matrix"
import type { Port } from "../Port"
import { getPcbSelectorErrorForTracePort } from "./getPcbSelectorErrorForTracePort"
import type { Trace } from "./Trace"

interface TraceGetRouteForPcbPathParams {
  trace: Trace
  path: PcbPath
  anchorPort: Port
  width: number
}

/**
 * Converts a PCB path from footprint-local millimetres (+X right, +Y up) into
 * a board-global Circuit JSON route. Selector points are already board-global.
 */
export const Trace_getRouteForPcbPath = ({
  trace,
  path,
  anchorPort,
  width,
}: TraceGetRouteForPcbPathParams): PcbTraceRoutePoint[] | undefined => {
  const { db } = trace.root!
  const subcircuit = trace.getSubcircuit()
  const transform = subcircuit._isInflatedFromCircuitJson
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

    const position = applyToPoint(transform, {
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
