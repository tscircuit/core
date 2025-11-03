interface ObstacleBase {
  layers: string[]
  connectedTo: string[]
  netIsAssignable?: boolean
  obstacle_type?: "trace" | "pad"
}

export interface RectObstacle extends ObstacleBase {
  type: "rect"
  center: { x: number; y: number }
  width: number
  height: number
}

export interface OvalObstacle extends ObstacleBase {
  type: "oval"
  center: { x: number; y: number }
  width: number
  height: number
}

export interface TraceSegmentObstacle extends ObstacleBase {
  type: "trace_segment_obstacle"
  corners: Array<{ x: number; y: number }>
  center: { x: number; y: number }
  width: number // segment length
  height: number // segment width
  rotation: number
}

export type Obstacle = RectObstacle | OvalObstacle | TraceSegmentObstacle
