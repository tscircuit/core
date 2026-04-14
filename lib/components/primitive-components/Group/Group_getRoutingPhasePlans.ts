import type { Trace } from "../Trace/Trace"
import type { Group } from "./Group"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"

export function Group_getRoutingPhasePlans(
  group: Group<any>,
): RoutingPhasePlan[] {
  const traces = group.selectAll("trace") as Trace[]

  if (traces.length === 0) return []

  return [
    {
      routingPhaseIndex: null,
      traces,
    },
  ]
}
