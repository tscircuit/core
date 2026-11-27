import type {
  BusProps,
  DifferentialPairProps,
  RouteLength,
} from "@tscircuit/props"
import type { SourceBus, SourceBusRouteLength, SourceTrace } from "circuit-json"
import { Bus } from "lib/components/primitive-components/Bus"
import { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { InflatorContext } from "../InflatorFn"
import { getSelectorPath } from "./inflateSourceTrace"

type SourceTraceId = SourceTrace["source_trace_id"]
type SourceBusKind = "differential_pair" | "bus"

function getSourceTraceSelector({
  sourceTraceId,
  inflatorContext,
}: {
  sourceTraceId: SourceTraceId
  inflatorContext: InflatorContext
}): string | undefined {
  const { injectionDb } = inflatorContext
  const sourceTrace = injectionDb.source_trace.get(sourceTraceId)
  if (!sourceTrace) return

  const sourceTraces = injectionDb.source_trace.list()
  const tracesWithSameName = sourceTraces.filter(
    (otherSourceTrace) => otherSourceTrace.name === sourceTrace.name,
  )
  if (sourceTrace.name && tracesWithSameName.length === 1) {
    return sourceTrace.name
  }

  const sourcePortId = sourceTrace.connected_source_port_ids.find(
    (sourcePortId) =>
      sourceTraces.every(
        (otherSourceTrace) =>
          otherSourceTrace.source_trace_id === sourceTraceId ||
          !otherSourceTrace.connected_source_port_ids.includes(sourcePortId),
      ),
  )
  if (sourcePortId === undefined) return
  const sourcePort = injectionDb.source_port.get(sourcePortId)
  if (!sourcePort) return
  if (!sourcePort.source_component_id) return `.${sourcePort.name}`

  const sourceComponent = injectionDb.source_component.get(
    sourcePort.source_component_id,
  )
  if (!sourceComponent) return
  const path = getSelectorPath(
    {
      name: sourceComponent.name,
      source_group_id: sourceComponent.source_group_id,
    },
    inflatorContext,
  )
  return `${path} > .${sourcePort.name}`
}

function getSourceTraceSelectors({
  sourceTraceIds,
  inflatorContext,
}: {
  sourceTraceIds: SourceTraceId[]
  inflatorContext: InflatorContext
}): string[] | undefined {
  const selectors: string[] = []
  for (const sourceTraceId of sourceTraceIds) {
    const selector = getSourceTraceSelector({ sourceTraceId, inflatorContext })
    if (selector === undefined) return
    selectors.push(selector)
  }
  return selectors
}

function getRouteLength({
  sourceBusRouteLength,
  inflatorContext,
}: {
  sourceBusRouteLength: SourceBusRouteLength
  inflatorContext: InflatorContext
}): RouteLength {
  if (typeof sourceBusRouteLength !== "object") return sourceBusRouteLength

  const { reference, offset, source_trace_ids } = sourceBusRouteLength
  const routeLength: RouteLength = { reference }
  if (offset !== undefined) routeLength.offset = offset
  if (source_trace_ids !== undefined) {
    const selectors = getSourceTraceSelectors({
      sourceTraceIds: source_trace_ids,
      inflatorContext,
    })
    if (!selectors) {
      throw new Error(
        `Cannot restore bus route-length constraint: could not resolve source traces ${source_trace_ids.join(", ")}`,
      )
    }
    routeLength.of = selectors
  }
  return routeLength
}

/** Determines which component represents the stored source bus. */
function getSourceBusKind({
  sourceBus,
}: { sourceBus: SourceBus }): SourceBusKind {
  if (sourceBus.differential_pair) return "differential_pair"
  return "bus"
}

/** Restores a differential pair with its trace selectors and constraints. */
function inflateDifferentialPair({
  sourceBus,
  differentialPair,
  inflatorContext,
}: {
  sourceBus: SourceBus
  differentialPair: NonNullable<SourceBus["differential_pair"]>
  inflatorContext: InflatorContext
}) {
  const { subcircuit } = inflatorContext
  const { name, max_length_skew } = sourceBus
  const positiveConnection = getSourceTraceSelector({
    sourceTraceId: differentialPair.positive_source_trace_id,
    inflatorContext,
  })
  const negativeConnection = getSourceTraceSelector({
    sourceTraceId: differentialPair.negative_source_trace_id,
    inflatorContext,
  })
  if (positiveConnection === undefined || negativeConnection === undefined) {
    return
  }

  const props: DifferentialPairProps = {
    positiveConnection,
    negativeConnection,
  }
  if (name !== undefined) props.name = name
  if (max_length_skew !== undefined) props.maxLengthSkew = max_length_skew
  if (sourceBus.target_differential_impedance !== undefined) {
    props.targetDifferentialImpedance = sourceBus.target_differential_impedance
  }
  if (differentialPair.trace_gap !== undefined) {
    props.pcbTraceGap = differentialPair.trace_gap
  }
  if (differentialPair.max_uncoupled_length !== undefined) {
    props.maxUncoupledLength = differentialPair.max_uncoupled_length
  }
  subcircuit.add(new DifferentialPair(props))
}

/** Restores a bus with its member selectors and length constraints. */
function inflateBus({
  sourceBus,
  inflatorContext,
}: {
  sourceBus: SourceBus
  inflatorContext: InflatorContext
}) {
  const { subcircuit } = inflatorContext
  const { name, max_length_skew } = sourceBus

  const connections = getSourceTraceSelectors({
    sourceTraceIds: sourceBus.source_trace_ids,
    inflatorContext,
  })
  if (!connections) return

  const props: BusProps = { connections }
  if (name !== undefined) props.name = name
  if (max_length_skew !== undefined) props.maxLengthSkew = max_length_skew
  for (const [property, sourceBusRouteLength] of [
    ["minLength", sourceBus.min_length],
    ["maxLength", sourceBus.max_length],
    ["targetLength", sourceBus.target_length],
  ] as const) {
    if (sourceBusRouteLength === undefined) continue
    props[property] = getRouteLength({
      sourceBusRouteLength,
      inflatorContext,
    })
  }
  if (sourceBus.length_tolerance !== undefined) {
    props.lengthTolerance = sourceBus.length_tolerance
  }
  subcircuit.add(new Bus(props))
}

/** Restores the component corresponding to a stored source bus. */
export function inflateSourceBus({
  sourceBus,
  inflatorContext,
}: {
  sourceBus: SourceBus
  inflatorContext: InflatorContext
}) {
  switch (getSourceBusKind({ sourceBus })) {
    case "differential_pair": {
      const { differential_pair } = sourceBus
      if (!differential_pair) return
      inflateDifferentialPair({
        sourceBus,
        differentialPair: differential_pair,
        inflatorContext,
      })
      return
    }
    case "bus":
      inflateBus({ sourceBus, inflatorContext })
      return
  }
}
