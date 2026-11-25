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
  if (sourceTrace.name) return sourceTrace.name

  const sourcePortId = sourceTrace.connected_source_port_ids[0]
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
  sourceBusRouteLength: SourceBusRouteLength | undefined
  inflatorContext: InflatorContext
}): RouteLength | undefined {
  if (typeof sourceBusRouteLength !== "object") return sourceBusRouteLength

  const { reference, offset, source_trace_ids } = sourceBusRouteLength
  const routeLength: RouteLength = { reference }
  if (offset !== undefined) routeLength.offset = offset
  if (source_trace_ids !== undefined) {
    const selectors = getSourceTraceSelectors({
      sourceTraceIds: source_trace_ids,
      inflatorContext,
    })
    if (!selectors) return
    routeLength.of = selectors
  }
  return routeLength
}

export function inflateSourceBus(
  sourceBus: SourceBus,
  inflatorContext: InflatorContext,
) {
  const { subcircuit } = inflatorContext
  const { name, differential_pair, max_length_skew } = sourceBus
  if (differential_pair) {
    const positiveConnection = getSourceTraceSelector({
      sourceTraceId: differential_pair.positive_source_trace_id,
      inflatorContext,
    })
    const negativeConnection = getSourceTraceSelector({
      sourceTraceId: differential_pair.negative_source_trace_id,
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
      props.targetDifferentialImpedance =
        sourceBus.target_differential_impedance
    }
    if (differential_pair.trace_gap !== undefined) {
      props.pcbTraceGap = differential_pair.trace_gap
    }
    if (differential_pair.max_uncoupled_length !== undefined) {
      props.maxUncoupledLength = differential_pair.max_uncoupled_length
    }
    subcircuit.add(new DifferentialPair(props))
    return
  }

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
    const routeLength = getRouteLength({
      sourceBusRouteLength,
      inflatorContext,
    })
    if (routeLength !== undefined) props[property] = routeLength
  }
  if (sourceBus.length_tolerance !== undefined) {
    props.lengthTolerance = sourceBus.length_tolerance
  }
  subcircuit.add(new Bus(props))
}
