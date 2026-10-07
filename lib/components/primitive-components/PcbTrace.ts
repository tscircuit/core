import { pcbTraceProps as publicPcbTraceProps } from "@tscircuit/props"
import {
  type PcbTraceRoutePoint,
  layer_ref,
  pcb_trace_route_point,
} from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

const coordinateRoutePoint = publicPcbTraceProps.shape.route.element
  .extend({
    // Do not let an invalid detailed route silently fall back to coordinates.
    route_type: z.never().optional(),
  })
  .superRefine((point, ctx) => {
    if (point.via && !point.to_layer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to_layer"],
        message: "A PCB trace via requires a destination layer",
      })
    }
    if (!point.via && point.to_layer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to_layer"],
        message: "A PCB trace destination layer requires via: true",
      })
    }
  })

export const pcbTraceProps = publicPcbTraceProps.extend({
  layer: layer_ref.optional(),
  route: z.union([
    z.array(pcb_trace_route_point),
    z.array(coordinateRoutePoint),
  ]),
  source_trace_id: z.string().optional(),
})

export type PcbTraceProps = z.input<typeof pcbTraceProps>

/**
 * Resolve coordinate routes in the containing footprint's right-handed local
 * PCB frame (+X right, +Y up, +Z above), in mm. Points pick up the parent
 * transform later; detailed Circuit JSON routes retain all their metadata.
 */
function resolvePcbTraceRoute(
  props: z.output<typeof pcbTraceProps>,
): PcbTraceRoutePoint[] {
  let layer = props.layer ?? "top"
  return props.route.flatMap((point): PcbTraceRoutePoint[] => {
    if ("route_type" in point && point.route_type) return [point]
    const width = point.trace_width ?? props.thickness ?? 0.15
    const wire: PcbTraceRoutePoint = {
      route_type: "wire",
      x: point.x,
      y: point.y,
      layer,
      width,
    }
    if (!point.via) return [wire]
    // The coordinate schema requires to_layer for every via.
    const toLayer = point.to_layer!
    const via: PcbTraceRoutePoint = {
      route_type: "via",
      x: point.x,
      y: point.y,
      from_layer: layer,
      to_layer: toLayer,
    }
    layer = toLayer
    return [wire, via, { ...wire, layer }]
  })
}

export class PcbTrace extends PrimitiveComponent<typeof pcbTraceProps> {
  pcb_trace_id: string | null = null
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
      source_trace_id: props.source_trace_id,
      route: transformedRoute,
      is_antenna_trace: this.isAntennaTrace,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })
    this.pcb_trace_id = pcb_trace.pcb_trace_id
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
    const { _parsedProps: props } = this
    if (!props.route || props.route.length === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const point of resolvePcbTraceRoute(props)) {
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
