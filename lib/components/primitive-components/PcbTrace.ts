import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"
import type { PcbTraceRoutePoint } from "circuit-json"
import { applyToPoint } from "transformation-matrix"

const pcbTraceRoutePointWireSchema = z.object({
  route_type: z.literal("wire"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  layer: z.string(),
  start_pcb_port_id: z.string().optional(),
  end_pcb_port_id: z.string().optional(),
})

const pcbTraceRoutePointViaSchema = z.object({
  route_type: z.literal("via"),
  x: z.number(),
  y: z.number(),
  from_layer: z.string(),
  to_layer: z.string(),
})

// Discriminated union for PcbTraceRoutePoint
const pcbTraceRoutePointSchema = z.discriminatedUnion("route_type", [
  pcbTraceRoutePointWireSchema,
  pcbTraceRoutePointViaSchema,
])

export const pcbTraceProps = z.object({
  route: z.array(pcbTraceRoutePointSchema),
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
    const parentTransform = container._computePcbGlobalTransformBeforeLayout()

    const transformedRoute = props.route.map((point) => {
      const { x, y, ...restOfPoint } = point
      const transformedPoint = applyToPoint(parentTransform, { x, y })
      return { ...transformedPoint, ...restOfPoint } as PcbTraceRoutePoint
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
    const { _parsedProps: props } = this
    if (!props.route || props.route.length === 0) {
      return { width: 0, height: 0 }
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity

    for (const point of props.route) {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
      // Consider trace width for a more accurate bounding box if necessary
      if (point.route_type === "wire") {
        minX = Math.min(minX, point.x - point.width / 2)
        maxX = Math.max(maxX, point.x + point.width / 2)
        minY = Math.min(minY, point.y - point.width / 2)
        maxY = Math.max(maxY, point.y + point.width / 2)
      }
    }

    if (
      minX === Infinity ||
      maxX === -Infinity ||
      minY === Infinity ||
      maxY === -Infinity
    ) {
      return { width: 0, height: 0 }
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}
