import { pcbTraceProps } from "@tscircuit/props"
import type { PcbTraceRoutePoint, SourceTrace } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { z } from "zod"
import { getViaSpanLayers } from "lib/utils/getViaSpanLayers"
import { getViaDiameterDefaults } from "lib/utils/pcbStyle/getViaDiameterDefaults"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export { pcbTraceProps }

export type PcbTraceProps = z.infer<typeof pcbTraceProps>
type SourceTraceId = SourceTrace["source_trace_id"]

/**
 * Resolve footprint-local points (mm, right-handed: +X right, +Y top, +Z above)
 * before placement transforms, without changing the supplied props.
 */
const resolvePcbTraceRoute = (props: PcbTraceProps): PcbTraceRoutePoint[] => {
  let currentLayer = props.layer ?? "top"
  return props.route.map((point): PcbTraceRoutePoint => {
    if (!("route_type" in point)) {
      return {
        route_type: "wire",
        x: point.x,
        y: point.y,
        width: point.trace_width ?? props.thickness ?? 0.1,
        layer: currentLayer,
      }
    }
    if (point.route_type === "wire") currentLayer = point.layer
    else if (point.route_type === "via") currentLayer = point.to_layer
    else currentLayer = point.end_layer
    return point
  })
}

export class PcbTrace extends PrimitiveComponent<typeof pcbTraceProps> {
  pcb_trace_id: string | null = null
  // Internal association with a source trace in the destination circuit.
  source_trace_id: SourceTraceId | null = null
  // Imported footprints can already supply the physical via as a pcb_via.
  _materializedRouteViaIndices = new Set<number>()
  // Marks radiating copper created by Antenna, never its feed connection.
  isAntennaTrace = false
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbTrace",
      zodProps: pcbTraceProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const container = this.getPrimitiveContainer()!
    const subcircuit = this.getSubcircuit()

    // Apply parent transformation to each point in the route
    const { isFlipped, maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const parentTransform = this._computePcbGlobalTransformBeforeLayout()

    const transformedRoute = resolvePcbTraceRoute(props).map((point) => {
      if (point.route_type === "wire") {
        const { x, y, ...restOfPoint } = point
        const transformedPoint = applyToPoint(parentTransform, { x, y })
        return {
          ...restOfPoint,
          ...transformedPoint,
          layer: maybeFlipLayer(point.layer),
        } as PcbTraceRoutePoint
      }

      if (point.route_type === "via") {
        const { x, y, ...restOfPoint } = point
        const transformedPoint = applyToPoint(parentTransform, { x, y })
        return {
          ...restOfPoint,
          ...transformedPoint,
          from_layer: maybeFlipLayer(point.from_layer),
          to_layer: maybeFlipLayer(point.to_layer),
          tented_on_top: isFlipped
            ? point.tented_on_bottom
            : point.tented_on_top,
          tented_on_bottom: isFlipped
            ? point.tented_on_top
            : point.tented_on_bottom,
        } as PcbTraceRoutePoint
      }

      return {
        ...point,
        start: applyToPoint(parentTransform, point.start),
        end: applyToPoint(parentTransform, point.end),
        start_layer: maybeFlipLayer(point.start_layer),
        end_layer: maybeFlipLayer(point.end_layer),
      } as PcbTraceRoutePoint
    })

    const pcb_trace = db.pcb_trace.insert({
      pcb_component_id: container.pcb_component_id!,
      source_trace_id: this.source_trace_id ?? undefined,
      route: transformedRoute,
      is_antenna_trace: this.isAntennaTrace,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })
    this.pcb_trace_id = pcb_trace.pcb_trace_id

    const { holeDiameter, padDiameter } = getViaDiameterDefaults(
      this.getInheritedMergedProperty("pcbStyle"),
    )
    for (const [routeIndex, point] of transformedRoute.entries()) {
      if (point.route_type !== "via") continue
      if (this._materializedRouteViaIndices.has(routeIndex)) continue
      db.pcb_via.insert({
        pcb_trace_id: pcb_trace.pcb_trace_id,
        x: point.x,
        y: point.y,
        hole_diameter: point.hole_diameter ?? holeDiameter,
        outer_diameter: point.outer_diameter ?? padDiameter,
        layers: getViaSpanLayers({
          fromLayer: point.from_layer,
          toLayer: point.to_layer,
          layerCount: subcircuit._getSubcircuitLayerCount(),
        }),
        from_layer: point.from_layer,
        to_layer: point.to_layer,
        tented_on_top: point.tented_on_top,
        tented_on_bottom: point.tented_on_bottom,
        subcircuit_id: pcb_trace.subcircuit_id,
        pcb_group_id: pcb_trace.pcb_group_id,
      })
    }
  }

  getPcbSize(): { width: number; height: number } {
    const bounds = this._getPcbLocalBoundsBeforeLayout()
    return {
      width: bounds.right - bounds.left,
      height: bounds.top - bounds.bottom,
    }
  }

  /**
   * The route points are authored in the containing footprint's right-handed
   * local PCB frame: +X right, +Y toward the top of the board, +Z above the
   * board, with coordinates and widths in mm.
   */
  _getPcbLocalBoundsBeforeLayout(): {
    left: number
    right: number
    top: number
    bottom: number
  } {
    const route = resolvePcbTraceRoute(this._parsedProps)
    if (route.length === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const point of route) {
      if (point.route_type === "through_pad") {
        minX = Math.min(minX, point.start.x, point.end.x)
        maxX = Math.max(maxX, point.start.x, point.end.x)
        minY = Math.min(minY, point.start.y, point.end.y)
        maxY = Math.max(maxY, point.start.y, point.end.y)
      } else {
        minX = Math.min(minX, point.x)
        maxX = Math.max(maxX, point.x)
        minY = Math.min(minY, point.y)
        maxY = Math.max(maxY, point.y)
      }

      if (point.route_type === "wire") {
        minX = Math.min(minX, point.x - point.width / 2)
        maxX = Math.max(maxX, point.x + point.width / 2)
        minY = Math.min(minY, point.y - point.width / 2)
        maxY = Math.max(maxY, point.y + point.width / 2)
      } else if (point.route_type === "through_pad") {
        minX = Math.min(
          minX,
          point.start.x - point.width / 2,
          point.end.x - point.width / 2,
        )
        maxX = Math.max(
          maxX,
          point.start.x + point.width / 2,
          point.end.x + point.width / 2,
        )
        minY = Math.min(
          minY,
          point.start.y - point.width / 2,
          point.end.y - point.width / 2,
        )
        maxY = Math.max(
          maxY,
          point.start.y + point.width / 2,
          point.end.y + point.width / 2,
        )
      }
    }

    if (
      minX === Infinity ||
      maxX === -Infinity ||
      minY === Infinity ||
      maxY === -Infinity
    ) {
      return { left: 0, right: 0, top: 0, bottom: 0 }
    }

    return {
      left: minX,
      right: maxX,
      top: maxY,
      bottom: minY,
    }
  }
}
