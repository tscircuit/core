import type { LayerRef, PcbTraceRoutePoint, PcbVia } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { getViaDiameterDefaults } from "../../../utils/pcbStyle/getViaDiameterDefaults"
import type { Port } from "../Port"
import type { Trace } from "./Trace"
import type { ImportedTracePayload } from "./imported-trace-payload-registry"

const findImportedPcbViaForPoint = (
  importedPcbVias: PcbVia[] | undefined,
  importedPcbTraceId: string,
  point: PcbTraceRoutePoint,
): PcbVia | undefined => {
  if (point.route_type !== "via") return undefined

  return importedPcbVias?.find(
    (via) =>
      via.pcb_trace_id === importedPcbTraceId &&
      Math.abs(via.x - point.x) < 0.0001 &&
      Math.abs(via.y - point.y) < 0.0001 &&
      (!via.from_layer || via.from_layer === point.from_layer) &&
      (!via.to_layer || via.to_layer === point.to_layer),
  )
}

const getViaDiameterFromRoutePoint = (point: PcbTraceRoutePoint) => {
  const viaPoint = point as PcbTraceRoutePoint & {
    hole_diameter?: number
    outer_diameter?: number
    via_hole_diameter?: number
    via_diameter?: number
  }

  return {
    holeDiameter: viaPoint.hole_diameter ?? viaPoint.via_hole_diameter,
    outerDiameter: viaPoint.outer_diameter ?? viaPoint.via_diameter,
  }
}

export const Trace_renderImportedPcbTraces = ({
  importedTracePayload,
  ports,
  trace,
}: {
  importedTracePayload: ImportedTracePayload
  ports: Port[]
  trace: Trace
}) => {
  const importedPcbTraces = importedTracePayload.importedPcbTraces
  if (!importedPcbTraces?.length) return false

  const { db } = trace.root!
  const subcircuit = trace.getSubcircuit()
  const { maybeFlipLayer } = trace._getPcbPrimitiveFlippedHelpers()
  const pcbGlobalTransform = trace._computePcbGlobalTransformBeforeLayout()
  const pcbStyle = trace.getInheritedMergedProperty("pcbStyle")
  const { holeDiameter, padDiameter } = getViaDiameterDefaults(pcbStyle)

  let firstPcbTraceId: string | null = null

  for (const importedPcbTrace of importedPcbTraces) {
    const transformedRoute = importedPcbTrace.route.map((point) => {
      if (point.route_type === "wire") {
        const { x, y, ...restOfPoint } = point
        const transformedPoint = applyToPoint(pcbGlobalTransform, { x, y })
        return {
          ...restOfPoint,
          ...transformedPoint,
          layer: maybeFlipLayer(point.layer),
        } as PcbTraceRoutePoint
      }

      if (point.route_type === "via") {
        const { x, y, ...restOfPoint } = point
        const transformedPoint = applyToPoint(pcbGlobalTransform, { x, y })
        return {
          ...restOfPoint,
          ...transformedPoint,
          from_layer: maybeFlipLayer(point.from_layer),
          to_layer: maybeFlipLayer(point.to_layer),
        } as PcbTraceRoutePoint
      }

      return {
        ...point,
        start: applyToPoint(pcbGlobalTransform, point.start),
        end: applyToPoint(pcbGlobalTransform, point.end),
        start_layer: maybeFlipLayer(point.start_layer),
        end_layer: maybeFlipLayer(point.end_layer),
      } as PcbTraceRoutePoint
    })

    const pcbTrace = db.pcb_trace.insert({
      ...importedPcbTrace,
      route: transformedRoute,
      source_trace_id: trace.source_trace_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
    })

    firstPcbTraceId ??= pcbTrace.pcb_trace_id
    trace.pcb_trace_id = pcbTrace.pcb_trace_id

    for (let index = 0; index < transformedRoute.length; index++) {
      const point = transformedRoute[index]
      if (point.route_type !== "via") continue

      const originalPoint = importedPcbTrace.route[index]
      const importedPcbVia = findImportedPcbViaForPoint(
        importedTracePayload.importedPcbVias,
        importedPcbTrace.pcb_trace_id,
        originalPoint,
      )
      const routePointViaDiameter = getViaDiameterFromRoutePoint(point)
      const fromLayer = maybeFlipLayer(
        (importedPcbVia?.from_layer ?? point.from_layer) as LayerRef,
      )
      const toLayer = maybeFlipLayer(
        (importedPcbVia?.to_layer ?? point.to_layer) as LayerRef,
      )
      const layers = (
        importedPcbVia?.layers ?? [point.from_layer as LayerRef, point.to_layer]
      ).map((layer) => maybeFlipLayer(layer as LayerRef))

      db.pcb_via.insert({
        pcb_trace_id: pcbTrace.pcb_trace_id,
        x: point.x,
        y: point.y,
        hole_diameter:
          importedPcbVia?.hole_diameter ??
          routePointViaDiameter.holeDiameter ??
          holeDiameter,
        outer_diameter:
          importedPcbVia?.outer_diameter ??
          routePointViaDiameter.outerDiameter ??
          padDiameter,
        layers,
        from_layer: fromLayer,
        to_layer: toLayer,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
        subcircuit_connectivity_map_key:
          importedPcbVia?.subcircuit_connectivity_map_key,
        net_is_assignable: importedPcbVia?.net_is_assignable,
        net_assigned: importedPcbVia?.net_assigned,
        is_tented: importedPcbVia?.is_tented,
      })
    }

    trace._insertErrorIfTraceIsOutsideBoard(pcbTrace.route, ports)
  }

  trace._portsRoutedOnPcb = ports
  trace.pcb_trace_id = firstPcbTraceId
  return true
}
