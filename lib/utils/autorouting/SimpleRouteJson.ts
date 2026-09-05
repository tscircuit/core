import type {
  SimpleRouteJson as AutorouterSimpleRouteJson,
  SimplifiedPcbTrace as AutorouterSimplifiedPcbTrace,
} from "@tscircuit/capacity-autorouter"
import type { PcbGroup } from "circuit-json"
import type { CircuitJsonMetadata, Obstacle } from "../obstacles/types"

export type { CircuitJsonMetadata, Obstacle } from "../obstacles/types"

export type PcbGroupId = PcbGroup["pcb_group_id"]
export type SimpleRouteBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type SimplifiedPcbTrace = Omit<
  AutorouterSimplifiedPcbTrace,
  "connection_name" | "route"
> & {
  type: "pcb_trace"
  pcb_trace_id: string
  connection_name?: string
  connectsTo?: string[]
  route: Array<
    | {
        route_type: "wire"
        x: number
        y: number
        width: number
        layer: string
      }
    | {
        route_type: "via"
        x: number
        y: number
        to_layer: string
        from_layer: string
        /** Physical copper layers occupied by the drilled barrel. */
        layers?: string[]
        via_diameter?: number
        via_hole_diameter?: number
      }
    | {
        route_type: "jumper"
        start: { x: number; y: number }
        end: { x: number; y: number }
        footprint: "0603" | "1206" | "1206x4_pair"
        layer: string
      }
    | {
        route_type: "through_obstacle"
        start: { x: number; y: number }
        end: { x: number; y: number }
        from_layer: string
        to_layer: string
        width: number
        circuitJsonMetadata?: CircuitJsonMetadata
      }
  >
}

/** A connection identifier in Simple Route JSON. */
export type SrjConnectionName = string

export type SimpleRoutePoint = {
  x: number
  y: number
  layer: string
  layers?: string[]
  pointId?: string
  pcb_port_id?: string
  /** Stable semantic selector for the source port, e.g. `U1.USB_DM`. */
  port_selector?: string
  terminalVia?: {
    toLayer: string
    viaDiameter?: number
  }
}

export type SimpleRouteConnection = {
  name: SrjConnectionName
  routingPcbGroupId?: PcbGroupId
  source_trace_id?: string
  rootConnectionName?: string
  mergedConnectionNames?: string[]
  isOffBoard?: boolean
  netConnectionName?: string
  nominalTraceWidth?: number
  /** @deprecated Use `nominalTraceWidth` instead. */
  width?: number
  pointsToConnect: SimpleRoutePoint[]
  /** @deprecated DO NOT USE **/
  externallyConnectedPointIds?: string[][]
}

/** Length-matching constraints for two connections in Simple Route JSON. */
export type SimpleRouteDifferentialPair = {
  connectionNames: [SrjConnectionName, SrjConnectionName]
  lengthTolerance: number
  traceGap?: number
  maxUncoupledLength?: number
}

/** A group of connections that an autorouter should keep together. */
export type SimpleRouteBusTermination =
  | {
      type: "boundary"
    }
  | {
      type: "plane"
      layer: string
    }

export type SimpleRouteBus = {
  busId: string
  name?: string
  connectionNames: SrjConnectionName[]
  /**
   * Per-connection downstream points that should guide fanout boundary exits.
   * These are routing hints and do not replace electrical endpoints. A known
   * layer lets paired fanouts preserve a compatible winding order.
   */
  connectionExitTargets?: Readonly<
    Record<SrjConnectionName, { x: number; y: number; layer?: string }>
  >
  maxLengthSkew?: number
  traceWidth?: number
  allowedLayers?: string[]
  /** Highest-priority fanout layer for this bus. */
  preferredLayer?: string
  /** Additional preferred fanout layers for this bus, in priority order. */
  preferredLayers?: string[]
  termination?: SimpleRouteBusTermination
}

export type SimpleRouteJson = Omit<
  AutorouterSimpleRouteJson,
  | "connections"
  | "traces"
  | "obstacles"
  | "bounds"
  | "outline"
  | "allowJumpers"
  | "availableJumperTypes"
  | "differentialPairs"
  | "buses"
> & {
  layerCount: number
  /** Whether autorouters may use vias that do not span the full board stack. */
  allowBlindAndBuriedVias?: boolean
  minTraceWidth: number
  nominalTraceWidth?: number
  /** @deprecated Use `min_via_pad_diameter` / `minViaPadDiameter` instead. */
  minViaDiameter?: number
  minViaHoleDiameter?: number
  minViaPadDiameter?: number
  min_via_hole_diameter?: number
  min_via_pad_diameter?: number
  defaultObstacleMargin?: number
  minTraceToPadEdgeClearance?: number
  minViaEdgeToPadEdgeClearance?: number
  minViaHoleEdgeToViaHoleEdgeClearance?: number
  minPlatedHoleDrillEdgeToDrillEdgeClearance?: number
  minPadEdgeToPadEdgeClearance?: number
  minBoardEdgeClearance?: number
  obstacles: Obstacle[]
  connections: SimpleRouteConnection[]
  bounds: SimpleRouteBounds
  outline?: Array<{ x: number; y: number }>
  // NOTE: this is only present after an autorouter solves the input
  traces?: SimplifiedPcbTrace[]
  jumpers?: Array<{
    jumper_footprint: "0603" | "1206x4"
    center: { x: number; y: number }
    orientation: "horizontal" | "vertical"
    width: number
    height: number
    pads: Obstacle[]
  }>
  // Enable jumper-based routing for single-layer boards
  allowJumpers?: boolean
  availableJumperTypes?: Array<"1206x4" | "0603">
  differentialPairs?: SimpleRouteDifferentialPair[]
  buses?: SimpleRouteBus[]
}

// declare module "autorouting-dataset" {
//   export type Obstacle = SimpleRouteJson["obstacles"][number]
//   export type SimpleRouteConnection = SimpleRouteJson["connections"][number]
//   export type SimplifiedPcbTrace = SimpleRouteJson["connections"][number]
// }
