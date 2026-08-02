import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type {
  AutorouterProp,
  AutoroutingPhaseProps,
  BreakoutProps,
} from "@tscircuit/props"
import type { z } from "zod"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Breakout } from "../Breakout/Breakout"
import { BreakoutPoint } from "../BreakoutPoint"
import type { Bus } from "../Bus"
import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"
import type { Group } from "./Group"
import type {
  RoutingPhaseDrcTolerances,
  RoutingPhasePlan,
} from "./GroupRoutingPhasePlan"

type GroupFanoutProps = Pick<
  BreakoutProps,
  | "busFanoutDirections"
  | "fanoutBoundaryPadding"
  | "fanoutRoutingLayers"
  | "fanoutPourNetMap"
>

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

function getTraceRoutingPhaseIndex(
  trace: Trace,
  buses: Bus[] = [],
): number | null {
  const busRoutingPhaseIndexes = new Set<number | null>()
  for (const bus of buses) {
    if (bus._parsedProps.routingPhaseIndex === undefined) continue
    const traceIsInBus = bus._parsedProps.connections.some(
      (connection) =>
        connection === trace.name ||
        traceHasEndpointMatchingConnectionSelector(
          trace,
          convertPortSelectorToEndpointKey(connection),
        ),
    )
    if (traceIsInBus) {
      busRoutingPhaseIndexes.add(bus._parsedProps.routingPhaseIndex)
    }
  }
  if (busRoutingPhaseIndexes.size > 1) {
    throw new Error(
      `Trace "${trace.name}" belongs to buses with different routing phases`,
    )
  }
  const busRoutingPhaseIndex = busRoutingPhaseIndexes.values().next().value
  if (busRoutingPhaseIndex !== undefined) {
    return busRoutingPhaseIndex
  }

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

function convertPortSelectorToEndpointKey(selector: string): string {
  return selector
    .trim()
    .replace(/\s*>\s*/g, ".")
    .replace(/\s+/g, ".")
    .replace(/^\./, "")
    .replace(/\.\./g, ".")
}

function getConnectionSelectorsFromAutoroutingPhaseProps(
  phaseProps: AutoroutingPhaseProps,
): string[] {
  return [
    ...(phaseProps.connection ? [phaseProps.connection] : []),
    ...(phaseProps.connections ?? []),
  ]
}

function traceHasEndpointMatchingConnectionSelector(
  trace: Trace,
  connectionSelectorEndpointKey: string,
): boolean {
  return trace
    .getTracePortPathSelectors()
    .some(
      (selector) =>
        convertPortSelectorToEndpointKey(selector) ===
        connectionSelectorEndpointKey,
    )
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
  const buses = group.selectAll("bus") as Bus[]
  const breakouts = (group.selectAll("group") as Group<z.ZodType>[]).filter(
    (candidate): candidate is Breakout => candidate.isRoutingDirective,
  )
  const breakoutByTrace = new Map<Trace, Breakout>()
  for (const trace of traces) {
    let ancestor = trace.parent
    while (ancestor && ancestor !== group) {
      if (ancestor.isRoutingDirective) {
        breakoutByTrace.set(trace, ancestor as Breakout)
        break
      }
      ancestor = ancestor.parent
    }
  }

  const plansByPhaseIndex = new Map<number | null, RoutingPhasePlan>()
  const autoroutersByPhaseIndex = getAutoroutersByPhaseIndex(group)
  const phasePropsByPhaseIndex = getAutoroutingPhasePropsByPhaseIndex(group)
  const groupFanoutProps = group._parsedProps as GroupFanoutProps
  const hasDirectRoutingTargets = traces.length > 0 || nets.length > 0
  const hasReroutePhase = Array.from(phasePropsByPhaseIndex.values()).some(
    (phaseProps) => phaseProps.reroute,
  )
  const hasConnectionTargetedPhase = Array.from(
    phasePropsByPhaseIndex.values(),
  ).some(
    (phaseProps) =>
      getConnectionSelectorsFromAutoroutingPhaseProps(phaseProps).length > 0,
  )

  if (
    !hasDirectRoutingTargets &&
    !hasReroutePhase &&
    !hasConnectionTargetedPhase &&
    breakouts.length === 0
  )
    return []

  for (const net of nets) {
    const routingPhaseIndex = getNetRoutingPhaseIndex(net)
    getOrCreateRoutingPhasePlan(plansByPhaseIndex, routingPhaseIndex).nets.push(
      net,
    )
  }

  for (const trace of traces) {
    if (breakoutByTrace.has(trace)) continue
    const routingPhaseIndex = getTraceRoutingPhaseIndex(trace, buses)
    getOrCreateRoutingPhasePlan(
      plansByPhaseIndex,
      routingPhaseIndex,
    ).traces.push(trace)
  }

  for (const [phaseIndex, phaseProps] of phasePropsByPhaseIndex) {
    const connectionSelectors =
      getConnectionSelectorsFromAutoroutingPhaseProps(phaseProps)
    if (connectionSelectors.length > 0) {
      const plan = getOrCreateRoutingPhasePlan(plansByPhaseIndex, phaseIndex)
      const connectionSelectorEndpointKeys = connectionSelectors.map(
        convertPortSelectorToEndpointKey,
      )
      plan.connectionSelectors = connectionSelectors

      for (const trace of traces) {
        if (breakoutByTrace.has(trace)) continue
        if (
          connectionSelectorEndpointKeys.some((endpointKey) =>
            traceHasEndpointMatchingConnectionSelector(trace, endpointKey),
          )
        ) {
          if (!phaseProps.reroute) {
            for (const existingPlan of plansByPhaseIndex.values()) {
              if (existingPlan === plan) continue
              existingPlan.traces = existingPlan.traces.filter(
                (existingTrace) => existingTrace !== trace,
              )
            }
          }
          if (plan.traces.includes(trace)) continue
          plan.traces.push(trace)
        }
      }
    }

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
    plan.connectionSelectors = phaseProps
      ? getConnectionSelectorsFromAutoroutingPhaseProps(phaseProps)
      : undefined
    plan.busFanoutDirections =
      phaseProps?.busFanoutDirections ?? groupFanoutProps.busFanoutDirections
    plan.fanoutBoundaryPadding =
      phaseProps?.fanoutBoundaryPadding ??
      groupFanoutProps.fanoutBoundaryPadding
    const fanoutRoutingLayers =
      phaseProps?.fanoutRoutingLayers ?? groupFanoutProps.fanoutRoutingLayers
    plan.fanoutRoutingLayers = fanoutRoutingLayers?.map((layer) =>
      typeof layer === "string" ? layer : layer.name,
    )
    plan.fanoutPourNetMap =
      phaseProps?.fanoutPourNetMap ?? groupFanoutProps.fanoutPourNetMap
    plan.drcTolerances = phaseProps
      ? getDrcTolerancesFromAutoroutingPhaseProps(phaseProps)
      : undefined
  }

  const breakoutPlans: RoutingPhasePlan[] = []
  for (const breakout of breakouts) {
    const breakoutProps = breakout._parsedProps as BreakoutProps
    const hasManualBreakoutPoints = breakout.children.some(
      (child) => child instanceof BreakoutPoint,
    )
    const shouldUseDefaultAutorouterForBreakoutPoints =
      hasManualBreakoutPoints && breakout.props.autorouter === undefined
    const breakoutTraces = traces.filter(
      (trace) => breakoutByTrace.get(trace) === breakout,
    )
    const unroutedBreakoutTraces = breakoutTraces.filter(
      (trace) => !trace.pcb_trace_id,
    )
    const pcbGroup = breakout.pcb_group_id
      ? breakout.root?.db.pcb_group.get(breakout.pcb_group_id)
      : null
    const outlineBounds = pcbGroup?.outline
      ? getBoundsFromPoints(pcbGroup.outline)
      : null
    const routingWidth =
      pcbGroup?.width ??
      (outlineBounds ? outlineBounds.maxX - outlineBounds.minX : undefined)
    const routingHeight =
      pcbGroup?.height ??
      (outlineBounds ? outlineBounds.maxY - outlineBounds.minY : undefined)
    const routingBounds =
      pcbGroup && routingWidth && routingHeight
        ? {
            minX: pcbGroup.center.x - routingWidth / 2,
            maxX: pcbGroup.center.x + routingWidth / 2,
            minY: pcbGroup.center.y - routingHeight / 2,
            maxY: pcbGroup.center.y + routingHeight / 2,
          }
        : undefined
    const rawBreakoutProps = breakout.props
    const hasExplicitGeometry =
      rawBreakoutProps.width !== undefined ||
      rawBreakoutProps.height !== undefined ||
      Boolean(rawBreakoutProps.outline?.length)
    const hasExplicitFanoutBoundaryPadding =
      rawBreakoutProps.fanoutBoundaryPadding !== undefined
    const breakoutPlan: RoutingPhasePlan = {
      routingPhaseIndex: null,
      routingPcbGroupId: breakout.pcb_group_id ?? undefined,
      routingBounds,
      fanoutBounds: hasExplicitGeometry
        ? routingBounds
        : hasExplicitFanoutBoundaryPadding
          ? undefined
          : routingBounds,
      autorouter: breakoutProps.autorouter ?? "fanout",
      busFanoutDirections: breakoutProps.busFanoutDirections,
      fanoutBoundaryPadding: breakoutProps.fanoutBoundaryPadding,
      fanoutRoutingLayers: breakoutProps.fanoutRoutingLayers?.map((layer) =>
        typeof layer === "string" ? layer : layer.name,
      ),
      fanoutPourNetMap: breakoutProps.fanoutPourNetMap,
      nets: [],
      traces: breakoutTraces,
    }

    if (!shouldUseDefaultAutorouterForBreakoutPoints) {
      breakoutPlans.push(breakoutPlan)
      continue
    }

    breakoutPlans.push({
      ...breakoutPlan,
      autorouter: "default",
      traces: [],
    })
    if (unroutedBreakoutTraces.length > 0) {
      const automaticFanoutBusIds = new Set(
        buses
          .filter((bus) =>
            unroutedBreakoutTraces.some((trace) =>
              bus._parsedProps.connections.some(
                (connection) =>
                  connection === trace.name ||
                  traceHasEndpointMatchingConnectionSelector(
                    trace,
                    convertPortSelectorToEndpointKey(connection),
                  ),
              ),
            ),
          )
          .map((bus) => bus.name),
      )
      for (const trace of unroutedBreakoutTraces) {
        if (trace.name) automaticFanoutBusIds.add(trace.name)
      }
      const automaticBusFanoutDirections = breakoutProps.busFanoutDirections
        ? Object.fromEntries(
            Object.entries(breakoutProps.busFanoutDirections).filter(
              ([busId]) => automaticFanoutBusIds.has(busId),
            ),
          )
        : undefined
      breakoutPlans.push({
        ...breakoutPlan,
        routingPcbGroupId: undefined,
        busFanoutDirections: automaticBusFanoutDirections,
        traces: unroutedBreakoutTraces,
      })
    }
  }

  const defaultPhaseProps = phasePropsByPhaseIndex.get(null)
  if (
    hasDirectRoutingTargets &&
    phasePropsByPhaseIndex.size === 1 &&
    defaultPhaseProps?.reroute &&
    plans.length === 1 &&
    plans[0]?.routingPhaseIndex === null
  ) {
    const reroutePlan = plans[0]
    return [
      ...breakoutPlans,
      {
        routingPhaseIndex: null,
        nets: [...reroutePlan.nets],
        traces: [...reroutePlan.traces],
      },
      reroutePlan,
    ]
  }

  return [...breakoutPlans, ...plans]
}
