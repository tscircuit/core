export type Obstacle = {
  obstacleId?: string
  componentId?: string
  /** Opaque producer metadata; autorouters must not use this for routing. */
  metadata?: Record<string, unknown>
  shape?: "circle"
  type: "rect"
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
