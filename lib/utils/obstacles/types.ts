export type Obstacle = {
  // TODO include ovals
  type: "rect" // NOTE: most datasets do not contain ovals
  layers: string[]
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
  netIsAssignable?: boolean
  offBoardConnectsTo?: string[]
}
