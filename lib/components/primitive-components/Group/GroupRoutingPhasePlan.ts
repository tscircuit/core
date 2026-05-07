import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"
import type { AutorouterProp, AutoroutingPhaseProps } from "@tscircuit/props"

export interface RoutingPhasePlan {
  routingPhaseIndex: number | null
  autorouter?: AutorouterProp
  reroute?: boolean
  region?: AutoroutingPhaseProps["region"]
  nets: Net[]
  traces: Trace[]
}
