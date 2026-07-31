import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"
import type { AutorouterProp, AutoroutingPhaseProps } from "@tscircuit/props"
import type {
  PcbGroupId,
  SimpleRouteBounds,
} from "lib/utils/autorouting/SimpleRouteJson"

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
  routingPcbGroupId?: PcbGroupId
  routingBounds?: SimpleRouteBounds
  autorouter?: AutorouterProp
  reroute?: boolean
  region?: AutoroutingPhaseProps["region"]
  connectionSelectors?: string[]
  busFanoutDirections?: AutoroutingPhaseProps["busFanoutDirections"]
  fanoutBoundaryPadding?: AutoroutingPhaseProps["fanoutBoundaryPadding"]
  fanoutRoutingLayers?: string[]
  fanoutPourNetMap?: AutoroutingPhaseProps["fanoutPourNetMap"]
  drcTolerances?: RoutingPhaseDrcTolerances
  nets: Net[]
  traces: Trace[]
}
