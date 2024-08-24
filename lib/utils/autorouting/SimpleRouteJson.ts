export type SimplifiedPcbTrace = {
  type: "pcb_trace"
  pcb_trace_id: string
  route: Array<{
    route_type: "wire" | "via"
    x: number
    y: number
    width: number
    layer: string
  }>
}
export type Obstacle = {
  // TODO include ovals
  type: "rect" // NOTE: most datasets do not contain ovals
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
}

export interface SimpleRouteConnection {
  name: string
  pointsToConnect: Array<{ x: number; y: number }>
}

export interface SimpleRouteJson {
  layerCount: number
  obstacles: Obstacle[]
  connections: Array<SimpleRouteConnection>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}

// declare module "autorouting-dataset" {
//   export type Obstacle = SimpleRouteJson["obstacles"][number]
//   export type SimpleRouteConnection = SimpleRouteJson["connections"][number]
//   export type SimplifiedPcbTrace = SimpleRouteJson["connections"][number]
// }
