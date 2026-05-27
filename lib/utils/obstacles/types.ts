export type Obstacle = {
  obstacleId?: string
  componentId?: string
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
