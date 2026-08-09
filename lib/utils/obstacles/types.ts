import type { PcbPlatedHole, PcbPort, PcbSmtPad, PcbVia } from "circuit-json"

export type Obstacle = {
  obstacleId?: string
  componentId?: string
  /** Circuit JSON identities represented by this obstacle. */
  pcb_smtpad_id?: PcbSmtPad["pcb_smtpad_id"]
  pcb_plated_hole_id?: PcbPlatedHole["pcb_plated_hole_id"]
  pcb_port_id?: PcbPort["pcb_port_id"]
  pcb_via_id?: PcbVia["pcb_via_id"]
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
