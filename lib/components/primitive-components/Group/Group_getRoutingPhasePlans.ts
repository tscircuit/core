import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type {
  AutorouterProp,
  AutoroutingPhaseProps,
  BreakoutProps,
} from "@tscircuit/props"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"
import type { z } from "zod"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Breakout } from "../Breakout/Breakout"
import { getSavedFanoutTraces } from "../Breakout/get-saved-fanout-traces"
import { BreakoutPoint } from "../BreakoutPoint"
import type { Bus } from "../Bus"
import type { Net } from "../Net"
import type { Port } from "../Port"
import type { Trace } from "../Trace/Trace"
import type { Group } from "./Group"
import type {
  RoutingPhaseDrcTolerances,
  RoutingPhasePlan,
} from "./GroupRoutingPhasePlan"
import { getSavedAutoroutingPhaseTraces } from "./get-saved-autorouting-phase-traces"

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
  if (
    phaseProps.connection === undefined &&
    phaseProps.connections === undefined
  ) {
    return phaseProps.pcbTracePaths?.map((path) => path.connection) ?? []
  }
  return [
    ...(phaseProps.connection ? [phaseProps.connection] : []),
    ...(phaseProps.connections ?? []),
  ]
}

function traceHasEndpointMatchingConnectionSelector(
  trace: Trace,
  connectionSelector: string,
): boolean {
  const connectionSelectorEndpointKey =
    convertPortSelectorToEndpointKey(connectionSelector)
  if (
    trace
      .getTracePortPathSelectors()
      .some(
        (selector) =>
          convertPortSelectorToEndpointKey(selector) ===
          connectionSelectorEndpointKey,
      )
  )
    return true
  // A saved path may use a pin label while the trace uses its pin number.
  // Resolve both to the port identity before deciding phase membership.
  const port = trace
    .getSubcircuit()
    .selectOne(connectionSelector, { type: "port" }) as Port | null
  return (
    port !== null &&
    (trace._findConnectedPorts().ports?.includes(port) ?? false)
  )
}

/** Resolve targets before assigning any phase ownership, including breakout traces. */
function resolvePhaseConnectionTraces(
  group: Group<z.ZodType>,
  traces: Trace[],
  phaseProps: AutoroutingPhaseProps,
): Set<Trace> {
  const resolvedTraces = new Set<Trace>()
  const phaseName = phaseProps.name ?? "unnamed phase"
  for (const rawSelector of getConnectionSelectorsFromAutoroutingPhaseProps(
    phaseProps,
  )) {
    const selector = rawSelector.trim()
    const explicitlySelectsTrace = selector.startsWith("trace.")
    const namedTraces = explicitlySelectsTrace
      ? group
          .selectAll<Trace>(selector)
          .filter((trace) => traces.includes(trace))
      : traces.filter((trace) => trace.name === selector)
    const endpointTraces = explicitlySelectsTrace
      ? []
      : traces.filter((trace) =>
          traceHasEndpointMatchingConnectionSelector(trace, selector),
        )
    if (
      namedTraces.length > 1 ||
      (namedTraces.length > 0 && endpointTraces.length > 0)
    ) {
      throw new Error(
        `Autorouting phase "${phaseName}": connection "${rawSelector}" is ambiguous. Use a unique trace name qualified as "trace.DDR_D0" or a port such as ".U1 > .A1".`,
      )
    }
    const matches = namedTraces.length > 0 ? namedTraces : endpointTraces
    if (matches.length === 0) {
      throw new Error(
        `Autorouting phase "${phaseName}": connection "${rawSelector}" matched no trace or endpoint. Use a trace name such as "DDR_D0" or a port such as ".U1 > .A1".`,
      )
    }
    for (const trace of matches) resolvedTraces.add(trace)
  }
  return resolvedTraces
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
    minTraceToHoleEdgeClearance,
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
    minTraceToHoleEdgeClearance === undefined &&
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
    minTraceToHoleEdgeClearance: toParsedDistance(minTraceToHoleEdgeClearance),
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

function splitPlansByLayerConstraints(
  plans: RoutingPhasePlan[],
): RoutingPhasePlan[] {
  const normalizeLayerList = (
    layers?: ReadonlyArray<string | { name: string }>,
  ): string[] | undefined => {
    if (!layers || layers.length === 0) return undefined
    return Array.from(
      new Set(
        layers.map((layer) => (typeof layer === "string" ? layer : layer.name)),
      ),
    ).sort()
  }
  const intersectLayerLists = (
    layerLists: ReadonlyArray<readonly string[] | undefined>,
  ): string[] | undefined => {
    const definedLists = layerLists.filter(
      (list): list is readonly string[] =>
        Array.isArray(list) && list.length > 0,
    )
    if (definedLists.length === 0) return undefined
    const [firstList, ...restLists] = definedLists
    return firstList.filter((layer) =>
      restLists.every((list) => list.includes(layer)),
    )
  }

  return plans.flatMap((plan) => {
    if (
      plan.reroute ||
      plan.routingPcbGroupId ||
      plan.getPrecomputedRoutingResult ||
      plan.testPointOptions
    ) {
      return [plan]
    }

    const netKeyByNet = new Map<Net, string>()
    for (const net of plan.nets) {
      const connectedTraces = plan.traces.filter((trace) =>
        trace._isExplicitlyConnectedToNet(net),
      )
      const effectiveLayers = intersectLayerLists([
        normalizeLayerList((net._parsedProps as any)?.pcbAllowedLayers),
        ...connectedTraces.map((trace) =>
          normalizeLayerList((trace._parsedProps as any)?.pcbAllowedLayers),
        ),
      ])
      netKeyByNet.set(net, effectiveLayers ? effectiveLayers.join(",") : "")
    }

    const traceKeyByTrace = new Map<Trace, string>()
    for (const trace of plan.traces) {
      const connectedNetsInPlan = plan.nets.filter((net) =>
        trace._isExplicitlyConnectedToNet(net),
      )
      if (connectedNetsInPlan.length > 0) {
        traceKeyByTrace.set(
          trace,
          netKeyByNet.get(connectedNetsInPlan[0]) ?? "",
        )
        continue
      }
      const connectedNets = trace._findConnectedNets().nets
      const effectiveLayers = intersectLayerLists([
        normalizeLayerList((trace._parsedProps as any)?.pcbAllowedLayers),
        ...connectedNets.map((net) =>
          normalizeLayerList((net._parsedProps as any)?.pcbAllowedLayers),
        ),
      ])
      traceKeyByTrace.set(
        trace,
        effectiveLayers ? effectiveLayers.join(",") : "",
      )
    }

    const distinctKeys = new Set<string>([
      ...netKeyByNet.values(),
      ...traceKeyByTrace.values(),
    ])
    if (distinctKeys.size <= 1) {
      return [plan]
    }

    const sortedKeys = Array.from(distinctKeys).sort((a, b) => {
      if (a === "") return 1
      if (b === "") return -1
      return a.split(",").length - b.split(",").length || a.localeCompare(b)
    })

    return sortedKeys.map((key) => ({
      ...plan,
      isLayerConstraintSubphase: true,
      nets: plan.nets.filter((net) => netKeyByNet.get(net) === key),
      traces: plan.traces.filter((trace) => traceKeyByTrace.get(trace) === key),
    }))
  })
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
  const breakoutByNet = new Map<Net, Breakout>()
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
  for (const net of nets) {
    // A net belongs to a breakout only when the user explicitly declares it
    // as a direct child. Nets inferred from component `connections` retain the
    // enclosing group's established routing behavior.
    if (
      net.parent?.isRoutingDirective &&
      breakouts.includes(net.parent as Breakout)
    ) {
      breakoutByNet.set(net, net.parent as Breakout)
    }
  }

  const plansByPhaseIndex = new Map<number | null, RoutingPhasePlan>()
  const autoroutersByPhaseIndex = getAutoroutersByPhaseIndex(group)
  const phasePropsByPhaseIndex = getAutoroutingPhasePropsByPhaseIndex(group)
  const selectedTracesByPhaseIndex = new Map(
    Array.from(phasePropsByPhaseIndex, ([phaseIndex, phaseProps]) => [
      phaseIndex,
      resolvePhaseConnectionTraces(group, traces, phaseProps),
    ]),
  )
  const groupFanoutProps = group._parsedProps as GroupFanoutProps
  const routeRemaining = group.getInheritedProperty("routeRemaining") !== false
  const defaultPhaseProps = phasePropsByPhaseIndex.get(null)
  // Keep source connectivity for DRC; only omit the implicit routing targets.
  // An explicit, untargeted phase still requests routing all connections.
  const includeUnassignedConnections =
    routeRemaining ||
    (defaultPhaseProps !== undefined &&
      !defaultPhaseProps.reroute &&
      getConnectionSelectorsFromAutoroutingPhaseProps(defaultPhaseProps)
        .length === 0)
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
    if (breakoutByNet.has(net)) continue
    const routingPhaseIndex = getNetRoutingPhaseIndex(net)
    if (routingPhaseIndex === null && !includeUnassignedConnections) continue
    getOrCreateRoutingPhasePlan(plansByPhaseIndex, routingPhaseIndex).nets.push(
      net,
    )
  }

  for (const trace of traces) {
    if (breakoutByTrace.has(trace)) continue
    const routingPhaseIndex = getTraceRoutingPhaseIndex(trace, buses)
    if (routingPhaseIndex === null && !includeUnassignedConnections) continue
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
      plan.connectionSelectors = connectionSelectors

      for (const trace of traces) {
        if (breakoutByTrace.has(trace)) continue
        if (selectedTracesByPhaseIndex.get(phaseIndex)!.has(trace)) {
          // A pin-to-net leg contributes a port to a single SRJ net connection.
          // Move that routing target with its selected trace; multi-port traces
          // (e.g. explicit differential-pair sections) retain path ownership.
          const connectedNets =
            trace._findConnectedPorts().ports?.length === 1
              ? nets.filter(
                  (net) =>
                    !breakoutByNet.has(net) &&
                    trace.subcircuit_connectivity_map_key !== null &&
                    net.subcircuit_connectivity_map_key ===
                      trace.subcircuit_connectivity_map_key,
                )
              : []
          for (const net of connectedNets) {
            if (!plan.nets.includes(net)) plan.nets.push(net)
          }
          if (!phaseProps.reroute) {
            for (const existingPlan of plansByPhaseIndex.values()) {
              if (existingPlan === plan) continue
              if (
                !phasePropsByPhaseIndex.get(existingPlan.routingPhaseIndex)
                  ?.reroute &&
                connectedNets.length > 0
              ) {
                existingPlan.nets = existingPlan.nets.filter(
                  (net) => !connectedNets.includes(net),
                )
              }
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

    if (phaseProps.reroute || phaseProps.pcbTracePaths !== undefined) {
      getOrCreateRoutingPhasePlan(plansByPhaseIndex, phaseIndex)
    }
  }

  const plans = Array.from(plansByPhaseIndex.values()).sort(
    compareRoutingPhasePlans,
  )
  for (const plan of plans) {
    plan.autorouter = autoroutersByPhaseIndex.get(plan.routingPhaseIndex)
    const phaseProps = phasePropsByPhaseIndex.get(plan.routingPhaseIndex)
    plan.algorithmFn = phaseProps?.algorithmFn
    plan.isImplicitRemainingPhase =
      plan.routingPhaseIndex === null && phaseProps === undefined
    plan.phaseName = phaseProps?.name
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

  for (const phase of group.selectAll(
    "autoroutingphase",
  ) as AutoroutingPhase[]) {
    const plan = plansByPhaseIndex.get(phase._parsedProps.phaseIndex ?? null)
    if (!plan) continue
    const props = phase._parsedProps
    if (props.addTestPoints) {
      plan.testPointOptions = {
        layer: props.testPointLayer ?? "bottom",
        diameter: props.testPointDiameter ?? 1,
        clearance: props.testPointClearance ?? 0.2,
        minProbeSpacing: props.testPointMinProbeSpacing ?? 2.54,
        maxDetour: props.testPointMaxDetour ?? 1,
      }
    }
    plan.autoroutingPhase = phase
    if (phase._parsedProps.pcbTracePaths === undefined) continue
    const config =
      plan.autorouter !== undefined
        ? getPresetAutoroutingConfig(plan.autorouter, group.root?.platform)
        : group._getAutorouterConfig()
    const isFanout = ["fanout", "single_layer_fanout"].includes(
      config.preset ?? "",
    )
    plan.getPrecomputedRoutingResult = (input) =>
      getSavedAutoroutingPhaseTraces(phase, input, isFanout)
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
      fanoutRegionPcbGroupId: breakout.pcb_group_id ?? undefined,
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
      nets: nets.filter((net) => breakoutByNet.get(net) === breakout),
      traces: breakoutTraces,
    }

    if (breakout.isDogboneFanout && breakoutProps.pcbTracePaths === undefined) {
      breakoutPlans.push({
        ...breakoutPlan,
        // Keep the local fanout outline while allowing dogbone sites outside
        // the pad bounding box to use the full board routing bounds.
        routingBounds: undefined,
        fanoutBounds: routingBounds,
      })
      continue
    }

    if (breakout._parsedProps.pcbTracePaths !== undefined) {
      breakoutPlans.push({
        ...breakoutPlan,
        autorouter: {
          local: true,
          groupMode: "subcircuit",
          allowViaInPad:
            (typeof breakoutProps.autorouter === "object"
              ? breakoutProps.autorouter.allowViaInPad
              : undefined) ?? group._getAutorouterConfig().allowViaInPad,
        },
        getPrecomputedRoutingResult: (input) => ({
          traces: getSavedFanoutTraces(breakout, input),
        }),
      })
      continue
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

  if (
    routeRemaining &&
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
        isImplicitRemainingPhase: true,
        nets: [...reroutePlan.nets],
        traces: [...reroutePlan.traces],
      },
      reroutePlan,
    ]
  }

  return splitPlansByLayerConstraints([...breakoutPlans, ...plans])
}
