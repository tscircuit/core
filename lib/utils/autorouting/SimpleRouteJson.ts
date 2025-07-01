export type SimplifiedPcbTrace = {
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
      }
  >
}
export type Obstacle = {
  // TODO include ovals
  type: "rect" // NOTE: most datasets do not contain ovals
  layers: string[]
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
}

export interface SimpleRouteConnection {
  name: string
  source_trace_id?: string
  pointsToConnect: Array<{
    x: number
    y: number
    layer: string
    pointId?: string // NEW – identifier used by the solver
    pcb_port_id?: string // (kept for convenience, was already used)
  }>
  externallyConnectedPointIds?: string[][] // NEW – groups of pointIds
}

export interface SimpleRouteJson {
  layerCount: number
  minTraceWidth: number
  obstacles: Obstacle[]
  connections: Array<SimpleRouteConnection>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  // NOTE: this is only present after an autorouter solves the input
  traces?: SimplifiedPcbTrace[]
}

// declare module "autorouting-dataset" {
//   export type Obstacle = SimpleRouteJson["obstacles"][number]
//   export type SimpleRouteConnection = SimpleRouteJson["connections"][number]
//   export type SimplifiedPcbTrace = SimpleRouteJson["connections"][number]
// }
