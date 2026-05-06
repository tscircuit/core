import type {
  SimpleRouteJson as AutorouterSimpleRouteJson,
  SimplifiedPcbTrace as AutorouterSimplifiedPcbTrace,
} from "@tscircuit/capacity-autorouter"

export type SimplifiedPcbTrace = Omit<
  AutorouterSimplifiedPcbTrace,
  "connection_name" | "route"
> & {
  type: "pcb_trace"
  pcb_trace_id: string
  connection_name?: string
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
      }
  >
}

export type Obstacle = {
  obstacleId?: string
  // TODO include ovals
  type: "rect" // NOTE: most datasets do not contain ovals
  layers: string[]
  zLayers?: number[]
  center: { x: number; y: number }
  width: number
  height: number
  ccwRotationDegrees?: number
  connectedTo: string[]
  isCopperPour?: boolean
  netIsAssignable?: boolean
  offBoardConnectsTo?: string[]
}

export type SimpleRouteConnection = {
  name: string
  source_trace_id?: string
  rootConnectionName?: string
  mergedConnectionNames?: string[]
  isOffBoard?: boolean
  netConnectionName?: string
  nominalTraceWidth?: number
  /** @deprecated Use `nominalTraceWidth` instead. */
  width?: number
  pointsToConnect: Array<{
    x: number
    y: number
    layer: string
    layers?: string[]
    pointId?: string
    pcb_port_id?: string
    terminalVia?: {
      toLayer: string
      viaDiameter?: number
    }
  }>
  /** @deprecated DO NOT USE **/
  externallyConnectedPointIds?: string[][]
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
  obstacles: Obstacle[]
  connections: SimpleRouteConnection[]
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
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
}

// declare module "autorouting-dataset" {
//   export type Obstacle = SimpleRouteJson["obstacles"][number]
//   export type SimpleRouteConnection = SimpleRouteJson["connections"][number]
//   export type SimplifiedPcbTrace = SimpleRouteJson["connections"][number]
// }
