import type { AutorouterProp, AutoroutingPhaseProps } from "@tscircuit/props"
import type {
  PcbGroupId,
  SimpleRouteBounds,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"

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
  fanoutBoundary?: SimpleRouteBounds
  breakoutPaddingBoundary?: SimpleRouteBounds
  ignoredFanoutBoundaryProperty?: "fanoutBoundaryPadding" | "padding"
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
