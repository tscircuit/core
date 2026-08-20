import type { AutorouterProp, AutoroutingPhaseProps } from "@tscircuit/props"
import type {
  PcbGroupId,
  SimpleRouteBounds,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
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
  phaseName?: AutoroutingPhaseProps["name"]
  routingPcbGroupId?: PcbGroupId
  routingBounds?: SimpleRouteBounds
  /** The single breakout/fanout boundary; breakout points may expand it. */
  fanoutBounds?: SimpleRouteBounds
  autorouter?: AutorouterProp
  reroute?: boolean
  region?: AutoroutingPhaseProps["region"]
  connectionSelectors?: string[]
  busFanoutDirections?: AutoroutingPhaseProps["busFanoutDirections"]
  fanoutBoundaryPadding?: AutoroutingPhaseProps["fanoutBoundaryPadding"]
  fanoutRoutingLayers?: string[]
  /** PCB components structurally contained by this fanout routing scope. */
  fanoutSourcePcbComponentIds?: PcbComponentId[]
  fanoutPourNetMap?: AutoroutingPhaseProps["fanoutPourNetMap"]
  drcTolerances?: RoutingPhaseDrcTolerances
  nets: Net[]
  traces: Trace[]
}
