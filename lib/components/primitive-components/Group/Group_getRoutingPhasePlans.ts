import type { AutorouterProp, AutoroutingPhaseProps } from "@tscircuit/props"
import type { z } from "zod"
import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Group } from "./Group"
import type {
  RoutingPhaseDrcTolerances,
  RoutingPhasePlan,
} from "./GroupRoutingPhasePlan"

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

function getAutoroutingPhasePropsByPhaseIndex(
  group: Group<z.ZodType>,
): Map<number | null, AutoroutingPhaseProps> {
  const autoroutingPhases = group.selectAll(
    "autoroutingphase",
  ) as AutoroutingPhase[]
  const propsByPhaseIndex = new Map<number | null, AutoroutingPhaseProps>()

  for (const autoroutingPhase of autoroutingPhases) {
    const props = autoroutingPhase._parsedProps as AutoroutingPhaseProps
    propsByPhaseIndex.set(props.phaseIndex ?? null, props)
  }

  return propsByPhaseIndex
}

function toParsedDistance(value: unknown): number | undefined {
  if (value === undefined) return undefined
  return Number(value)
}

function getDrcTolerancesFromAutoroutingPhaseProps(
  phaseProps: AutoroutingPhaseProps,
): RoutingPhaseDrcTolerances | undefined {
  const {
    minTraceWidth,
    minViaHoleEdgeToViaHoleEdgeClearance,
    minPlatedHoleDrillEdgeToDrillEdgeClearance,
    minTraceToPadEdgeClearance,
    minPadEdgeToPadEdgeClearance,
    minBoardEdgeClearance,
    minViaEdgeToPadEdgeClearance,
    minViaHoleDiameter,
    minViaPadDiameter,
  } = phaseProps

  if (
    minTraceWidth === undefined &&
    minViaHoleEdgeToViaHoleEdgeClearance === undefined &&
    minPlatedHoleDrillEdgeToDrillEdgeClearance === undefined &&
    minTraceToPadEdgeClearance === undefined &&
    minPadEdgeToPadEdgeClearance === undefined &&
    minBoardEdgeClearance === undefined &&
    minViaEdgeToPadEdgeClearance === undefined &&
    minViaHoleDiameter === undefined &&
    minViaPadDiameter === undefined
  ) {
    return undefined
  }

  return {
    minTraceWidth: toParsedDistance(minTraceWidth),
    minViaHoleEdgeToViaHoleEdgeClearance: toParsedDistance(
      minViaHoleEdgeToViaHoleEdgeClearance,
    ),
    minPlatedHoleDrillEdgeToDrillEdgeClearance: toParsedDistance(
      minPlatedHoleDrillEdgeToDrillEdgeClearance,
    ),
    minTraceToPadEdgeClearance: toParsedDistance(minTraceToPadEdgeClearance),
    minPadEdgeToPadEdgeClearance: toParsedDistance(
      minPadEdgeToPadEdgeClearance,
    ),
    minBoardEdgeClearance: toParsedDistance(minBoardEdgeClearance),
    minViaEdgeToPadEdgeClearance: toParsedDistance(
      minViaEdgeToPadEdgeClearance,
    ),
    minViaHoleDiameter: toParsedDistance(minViaHoleDiameter),
    minViaPadDiameter: toParsedDistance(minViaPadDiameter),
  }
}

export function Group_getRoutingPhasePlans(
  group: Group<z.ZodType>,
): RoutingPhasePlan[] {
  const traces = group.selectAll("trace") as Trace[]
  const nets = group.selectAll("net") as Net[]

  if (traces.length === 0 && nets.length === 0) return []

  const plansByPhaseIndex = new Map<number | null, RoutingPhasePlan>()
  const autoroutersByPhaseIndex = getAutoroutersByPhaseIndex(group)
  const phasePropsByPhaseIndex = getAutoroutingPhasePropsByPhaseIndex(group)

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

  for (const [phaseIndex, phaseProps] of phasePropsByPhaseIndex) {
    if (phaseProps.reroute) {
      getOrCreateRoutingPhasePlan(plansByPhaseIndex, phaseIndex)
    }
  }

  const plans = Array.from(plansByPhaseIndex.values()).sort(
    compareRoutingPhasePlans,
  )
  for (const plan of plans) {
    plan.autorouter = autoroutersByPhaseIndex.get(plan.routingPhaseIndex)
    const phaseProps = phasePropsByPhaseIndex.get(plan.routingPhaseIndex)
    plan.reroute = phaseProps?.reroute
    plan.region = phaseProps?.region
    plan.drcTolerances = phaseProps
      ? getDrcTolerancesFromAutoroutingPhaseProps(phaseProps)
      : undefined
  }

  const defaultPhaseProps = phasePropsByPhaseIndex.get(null)
  if (
    phasePropsByPhaseIndex.size === 1 &&
    defaultPhaseProps?.reroute &&
    plans.length === 1 &&
    plans[0]?.routingPhaseIndex === null
  ) {
    const reroutePlan = plans[0]
    return [
      {
        routingPhaseIndex: null,
        nets: [...reroutePlan.nets],
        traces: [...reroutePlan.traces],
      },
      reroutePlan,
    ]
  }

  return plans
}
