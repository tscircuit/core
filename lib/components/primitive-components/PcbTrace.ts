import { type PcbTraceRoutePoint, pcb_trace_route_point } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export const pcbTraceProps = z.object({
  route: z.array(pcb_trace_route_point),
  // If this primitive PcbTrace needs to be associated with a source_trace_id
  // it can be added as a prop here. For footprints, it's often not needed.
  source_trace_id: z.string().optional(),
})

export type PcbTraceProps = z.infer<typeof pcbTraceProps>

export class PcbTrace extends PrimitiveComponent<typeof pcbTraceProps> {
  pcb_trace_id: string | null = null
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
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const parentTransform = this._computePcbGlobalTransformBeforeLayout()

    const transformedRoute = props.route.map((point) => {
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

    for (const point of props.route) {
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
