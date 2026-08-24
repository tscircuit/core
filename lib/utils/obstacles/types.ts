export type CircuitJsonMetadata = {
  pcb_smtpad_id?: string
  pcb_plated_hole_id?: string
  pcb_port_id?: string
  pcb_via_id?: string
  source_component_name?: string
  source_port_name?: string
}

export type Obstacle = {
  obstacleId?: string
  componentId?: string
  /** True when this obstacle replaces one completed fanout source footprint. */
  isFanoutSourceKeepout?: boolean
  /** Circuit JSON provenance carried through SRJ but forbidden for routing. */
  circuitJsonMetadata?: CircuitJsonMetadata
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
