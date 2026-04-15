import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"

export interface RoutingPhasePlan {
  routingPhaseIndex: number | null
  nets: Net[]
  traces: Trace[]
}
