import { anchorCopperToPorts } from "./port-anchored-routing"
import { EventEmitter } from "eventemitter3"
import type {
  SimpleRouteJson,
  SimplifiedPcbTraces,
} from "@tscircuit/capacity-autorouter"
import { z } from "zod"

export type SavedCopper = {
  connectionName: string
  anchors: { x: number; y: number; layer: string; portId: string }[]
  traces: SimplifiedPcbTraces
}

const coordinates = { x: z.number().finite(), y: z.number().finite() }
const rawRoutePointSchema = z.discriminatedUnion("route_type", [
  z.object({
    route_type: z.literal("wire"),
    ...coordinates,
    width: z.number().positive(),
    layer: z.string(),
    start_pcb_port_id: z.string().optional(),
    end_pcb_port_id: z.string().optional(),
  }),
  z.object({
    route_type: z.literal("via"),
    ...coordinates,
    from_layer: z.string(),
    to_layer: z.string(),
    layers: z.array(z.string()).optional(),
    via_diameter: z.number().positive().optional(),
    via_hole_diameter: z.number().positive().optional(),
  }),
  z.object({
    route_type: z.literal("through_obstacle"),
    start: z.object(coordinates),
    end: z.object(coordinates),
    from_layer: z.string(),
    to_layer: z.string(),
    width: z.number().positive(),
    circuitJsonMetadata: z
      .object({
        pcb_smtpad_id: z.string().optional(),
        pcb_plated_hole_id: z.string().optional(),
        pcb_port_id: z.string().optional(),
        pcb_via_id: z.string().optional(),
        source_component_name: z.string().optional(),
        source_port_name: z.string().optional(),
      })
      .optional(),
  }),
])

const savedCopperSchema = z.object({
  connectionName: z.string(),
  anchors: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
      layer: z.string(),
      portId: z.string(),
    }),
  ),
  traces: z.array(
    z.object({
      type: z.literal("pcb_trace"),
      pcb_trace_id: z.string(),
      connection_name: z.string(),
      connectsTo: z.array(z.string()).optional(),
      route: z.array(rawRoutePointSchema),
    }),
  ),
})

export function parseSavedCopperRecord(
  savedRouteJson: unknown,
): Record<string, SavedCopper> {
  return z.record(savedCopperSchema).parse(savedRouteJson)
}

type RoutingEvents = { complete: [{ traces: SimplifiedPcbTraces }] }

export class SavedAutorouter extends EventEmitter<RoutingEvents> {
  private input: SimpleRouteJson
  private traces: SimplifiedPcbTraces
  private timer?: ReturnType<typeof setTimeout>

  constructor(input: SimpleRouteJson, saved: SavedCopper) {
    super()
    this.input = input
    if (input.connections.length !== 1)
      throw new Error("A saved net must have one routing connection")
    const connection = input.connections[0]!
    const points = connection.pointsToConnect
    const portIds = new Map<string, string>()
    if (points.length !== saved.anchors.length)
      throw new Error("Saved routing endpoint count changed; regenerate routes")
    for (const anchor of saved.anchors) {
      const point = points.find(
        (candidate) =>
          Math.abs(candidate.x - anchor.x) < 0.000001 &&
          Math.abs(candidate.y - anchor.y) < 0.000001 &&
          candidate.layer === anchor.layer,
      )
      if (!point)
        throw new Error(
          `Saved routing endpoint moved from (${anchor.x}, ${anchor.y}); regenerate routes`,
        )
      portIds.set(
        anchor.portId,
        point.pcb_port_id ?? point.pointId ?? anchor.portId,
      )
    }
    const reboundTraces = saved.traces.map((trace, index) => ({
      ...trace,
      pcb_trace_id: `saved_copper_${connection.name}_${index}`,
      connection_name: connection.name,
      connectsTo: [
        ...new Set([
          ...(trace.connectsTo?.map(
            (portId) => portIds.get(portId) ?? portId,
          ) ?? []),
          ...points.flatMap((point) =>
            point.pcb_port_id ? [point.pcb_port_id] : [],
          ),
        ]),
      ],
      route: trace.route.map((point) => {
        if (point.route_type === "wire")
          return {
            ...point,
            start_pcb_port_id: point.start_pcb_port_id
              ? (portIds.get(point.start_pcb_port_id) ??
                point.start_pcb_port_id)
              : undefined,
            end_pcb_port_id: point.end_pcb_port_id
              ? (portIds.get(point.end_pcb_port_id) ?? point.end_pcb_port_id)
              : undefined,
          }
        if (
          point.route_type === "through_obstacle" &&
          point.circuitJsonMetadata?.pcb_port_id
        ) {
          const portId =
            portIds.get(point.circuitJsonMetadata.pcb_port_id) ??
            point.circuitJsonMetadata.pcb_port_id
          const physicalPad = input.obstacles.find(
            (obstacle) =>
              obstacle.circuitJsonMetadata?.pcb_port_id === portId &&
              obstacle.circuitJsonMetadata?.pcb_plated_hole_id,
          )
          return {
            ...point,
            circuitJsonMetadata: {
              ...point.circuitJsonMetadata,
              pcb_port_id: portId,
              pcb_plated_hole_id:
                physicalPad?.circuitJsonMetadata?.pcb_plated_hole_id ??
                point.circuitJsonMetadata.pcb_plated_hole_id,
            },
          }
        }
        return point
      }),
    }))
    this.traces = anchorCopperToPorts({ input, traces: reboundTraces })
  }

  start() {
    this.timer = setTimeout(
      () => this.emit("complete", { traces: this.traces }),
      0,
    )
  }

  stop() {
    if (this.timer !== undefined) clearTimeout(this.timer)
  }

  getOutputSimpleRouteJson(): SimpleRouteJson {
    return {
      ...this.input,
      traces: [...(this.input.traces ?? []), ...this.traces],
    }
  }
}
