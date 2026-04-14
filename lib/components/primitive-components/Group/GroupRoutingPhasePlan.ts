import type { Trace } from "../Trace/Trace"

export interface RoutingPhasePlan {
  routingPhaseIndex: number | null
  traces: Trace[]
}
