import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"
import type { AutorouterProp, AutoroutingPhaseProps } from "@tscircuit/props"

export interface RoutingPhaseDrcTolerances {
  minTraceWidth?: number
  minViaHoleEdgeToViaHoleEdgeClearance?: number
  minPlatedHoleDrillEdgeToDrillEdgeClearance?: number
  minTraceToPadEdgeClearance?: number
  minPadEdgeToPadEdgeClearance?: number
  minBoardEdgeClearance?: number
  minViaEdgeToPadEdgeClearance?: number
  minViaHoleDiameter?: number
  minViaPadDiameter?: number
}

export interface RoutingPhasePlan {
  routingPhaseIndex: number | null
  autorouter?: AutorouterProp
  reroute?: boolean
  region?: AutoroutingPhaseProps["region"]
  drcTolerances?: RoutingPhaseDrcTolerances
  nets: Net[]
  traces: Trace[]
}
