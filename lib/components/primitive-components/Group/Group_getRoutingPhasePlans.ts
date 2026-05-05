import type { AutorouterProp } from "@tscircuit/props"
import type { z } from "zod"
import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Group } from "./Group"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"

function getPhaseSortValue(routingPhaseIndex: number | null): number {
  return routingPhaseIndex === null
    ? Number.POSITIVE_INFINITY
    : routingPhaseIndex
}

function compareRoutingPhasePlans(
  a: RoutingPhasePlan,
  b: RoutingPhasePlan,
): number {
  return (
    getPhaseSortValue(a.routingPhaseIndex) -
    getPhaseSortValue(b.routingPhaseIndex)
  )
}

function getOrCreateRoutingPhasePlan(
  plansByPhaseIndex: Map<number | null, RoutingPhasePlan>,
  routingPhaseIndex: number | null,
): RoutingPhasePlan {
  let plan = plansByPhaseIndex.get(routingPhaseIndex)
  if (!plan) {
    plan = { routingPhaseIndex, nets: [], traces: [] }
    plansByPhaseIndex.set(routingPhaseIndex, plan)
  }
  return plan
}

function getNetRoutingPhaseIndex(net: Net): number | null {
  return net.props.routingPhaseIndex ?? null
}

function getTraceRoutingPhaseIndex(trace: Trace): number | null {
  const traceRoutingPhaseIndex = trace.props.routingPhaseIndex
  if (traceRoutingPhaseIndex !== undefined) return traceRoutingPhaseIndex

  let routingPhaseIndex: number | null = null
  const connectedNets = trace._findConnectedNets().nets
  for (const net of connectedNets) {
    const netRoutingPhaseIndex = getNetRoutingPhaseIndex(net)
    if (typeof netRoutingPhaseIndex === "number") {
      if (
        routingPhaseIndex === null ||
        netRoutingPhaseIndex < routingPhaseIndex
      ) {
        routingPhaseIndex = netRoutingPhaseIndex
      }
    }
  }

  return routingPhaseIndex
}

function getAutoroutersByPhaseIndex(
  group: Group<z.ZodType>,
): Map<number | null, AutorouterProp> {
  const autoroutingPhases = group.selectAll(
    "autoroutingphase",
  ) as AutoroutingPhase[]
  const autoroutersByPhaseIndex = new Map<number | null, AutorouterProp>()

  for (const autoroutingPhase of autoroutingPhases) {
    const { phaseIndex, autorouter } = autoroutingPhase._parsedProps
    if (autorouter === undefined) continue
    autoroutersByPhaseIndex.set(phaseIndex ?? null, autorouter)
  }

  return autoroutersByPhaseIndex
}

export function Group_getRoutingPhasePlans(
  group: Group<z.ZodType>,
): RoutingPhasePlan[] {
  const traces = group.selectAll("trace") as Trace[]
  const nets = group.selectAll("net") as Net[]

  if (traces.length === 0 && nets.length === 0) return []

  const plansByPhaseIndex = new Map<number | null, RoutingPhasePlan>()
  const autoroutersByPhaseIndex = getAutoroutersByPhaseIndex(group)

  for (const net of nets) {
    const routingPhaseIndex = getNetRoutingPhaseIndex(net)
    getOrCreateRoutingPhasePlan(plansByPhaseIndex, routingPhaseIndex).nets.push(
      net,
    )
  }

  for (const trace of traces) {
    const routingPhaseIndex = getTraceRoutingPhaseIndex(trace)
    getOrCreateRoutingPhasePlan(
      plansByPhaseIndex,
      routingPhaseIndex,
    ).traces.push(trace)
  }

  const plans = Array.from(plansByPhaseIndex.values()).sort(
    compareRoutingPhasePlans,
  )
  for (const plan of plans) {
    plan.autorouter = autoroutersByPhaseIndex.get(plan.routingPhaseIndex)
  }
  return plans
}
