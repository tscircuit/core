import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"
import type { AutorouterProp } from "@tscircuit/props"

export interface RoutingPhasePlan {
  routingPhaseIndex: number | null
  autorouter?: AutorouterProp
  nets: Net[]
  traces: Trace[]
}
