import type {
  AutorouterProp,
  AutoroutingPhaseProps,
  BreakoutProps,
} from "@tscircuit/props"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { z } from "zod"
import type { Bus } from "../Bus"
import type { Net } from "../Net"
import type { Trace } from "../Trace/Trace"
import type { AutoroutingPhase } from "../AutoroutingPhase"
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

const getDescendantsInRoutingScope = (
  group: Group<z.ZodType>,
): PrimitiveComponent[] => {
  const descendants: PrimitiveComponent[] = []
  const visitChildren = (children: PrimitiveComponent[]) => {
    for (const child of children) {
      if (child.isSubcircuit) continue
      descendants.push(child)
      visitChildren(child.children)
    }
  }
  visitChildren(group.children)
  return descendants
}

const selectAllInRoutingScope = <T extends PrimitiveComponent>(
  group: Group<z.ZodType>,
  componentName: string,
): T[] => {
  if (!Array.isArray(group.children)) {
    return group.selectAll(componentName) as T[]
  }
  return getDescendantsInRoutingScope(group).filter(
    (component) => component.lowercaseComponentName === componentName,
  ) as T[]
}

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
  const autoroutingPhases = selectAllInRoutingScope<AutoroutingPhase>(
    group,
    "autoroutingphase",
  )
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
  const autoroutingPhases = selectAllInRoutingScope<AutoroutingPhase>(
    group,
    "autoroutingphase",
  )
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
  const traces = selectAllInRoutingScope<Trace>(group, "trace")
  const nets = selectAllInRoutingScope<Net>(group, "net")
  const buses = selectAllInRoutingScope<Bus>(group, "bus")

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
    !hasConnectionTargetedPhase
  )
    return []

  for (const net of nets) {
    const routingPhaseIndex = getNetRoutingPhaseIndex(net)
    getOrCreateRoutingPhasePlan(plansByPhaseIndex, routingPhaseIndex).nets.push(
      net,
    )
  }

  for (const trace of traces) {
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
