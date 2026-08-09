import type {
  SimpleRouteJson as AutorouterSimpleRouteJson,
  SimplifiedPcbTrace as AutorouterSimplifiedPcbTrace,
} from "@tscircuit/capacity-autorouter"
import type { PcbGroup } from "circuit-json"
import type { Obstacle } from "../obstacles/types"

export type { Obstacle } from "../obstacles/types"

export type PcbGroupId = PcbGroup["pcb_group_id"]
export type SimpleRouteBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type SimplifiedPcbTrace = Omit<
  AutorouterSimplifiedPcbTrace,
  "connection_name" | "connectsTo"
> & {
  connection_name?: string
  connectsTo?: string[]
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
  maxLengthSkew?: number
  traceWidth?: number
  allowedLayers?: string[]
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
