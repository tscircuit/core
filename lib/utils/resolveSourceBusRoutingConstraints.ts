import type {
  SourceBusRouteLength,
  SourceBusTraceSpacing,
  SourceTrace,
} from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { Port } from "lib/components/primitive-components/Port/Port"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"

type SourceTraceId = SourceTrace["source_trace_id"]
/** Run after all buses and pairs have exported membership. Selectors refer to
 * source traces, ports, buses or pairs in the declaring subcircuit. */
export function resolveSourceBusRoutingConstraints(
  component: Bus | DifferentialPair,
) {
  if (!component.source_bus_id) return
  const { db } = component.root!
  const subcircuit = component.getSubcircuit()
  const sources = db.source_trace
    .list()
    .filter((trace) => trace.subcircuit_id === subcircuit.subcircuit_id)
  const resolve = (selectors: string[]): SourceTraceId[] => [
    ...new Set(
      selectors.flatMap((selector) => {
        const named = sources.filter((trace) => trace.name === selector)
        if (named.length > 1)
          throw new Error(
            `Routing reference "${selector}" matches multiple traces in "${component.name}"`,
          )
        if (named.length) return named.map((trace) => trace.source_trace_id)
        const selected = subcircuit.selectAll<
          Bus | DifferentialPair | Port | Trace
        >(selector)
        const ids = selected.flatMap((target) => {
          if ("source_bus_id" in target && target.source_bus_id)
            return (
              db.source_bus.get(target.source_bus_id)?.source_trace_ids ?? []
            )
          if ("source_trace_id" in target && target.source_trace_id)
            return [target.source_trace_id]
          if ("source_port_id" in target && target.source_port_id) {
            const traces = sources.filter((trace) =>
              trace.connected_source_port_ids.includes(target.source_port_id!),
            )
            if (traces.length > 1)
              throw new Error(
                `Routing reference "${selector}" matches a port on multiple traces in "${component.name}"`,
              )
            return traces.map((trace) => trace.source_trace_id)
          }
          return []
        })
        if (!ids.length)
          throw new Error(
            `Could not resolve routing reference "${selector}" in "${component.name}"`,
          )
        return ids
      }),
    ),
  ]
  const props = component._parsedProps
  const length = (
    value: typeof props.minLength,
  ): SourceBusRouteLength | undefined => {
    if (value === undefined || typeof value === "number") return value
    return {
      reference: value.reference,
      offset: value.offset,
      ...(value.of ? { source_trace_ids: resolve(value.of) } : {}),
    }
  }
  const spacing = (
    value: typeof props.pcbSpacingToOtherSignals,
  ): SourceBusTraceSpacing | undefined =>
    value === undefined || typeof value === "number"
      ? value
      : { width_multiplier: value.widthMultiplier }
  db.source_bus.update(component.source_bus_id, {
    length_match_source_trace_ids: props.lengthMatchTo
      ? resolve(
          typeof props.lengthMatchTo === "string"
            ? [props.lengthMatchTo]
            : props.lengthMatchTo,
        )
      : undefined,
    min_length: length(props.minLength),
    max_length: length(props.maxLength),
    target_length: length(props.targetLength),
    length_tolerance: props.lengthTolerance,
    pcb_trace_spacing:
      "pcbTraceSpacing" in props ? spacing(props.pcbTraceSpacing) : undefined,
    pcb_spacing_to_other_signals: spacing(props.pcbSpacingToOtherSignals),
    target_impedance_min:
      "targetImpedanceMin" in props ? props.targetImpedanceMin : undefined,
    target_impedance_max:
      "targetImpedanceMax" in props ? props.targetImpedanceMax : undefined,
    target_differential_impedance_min:
      "targetDifferentialImpedanceMin" in props
        ? props.targetDifferentialImpedanceMin
        : undefined,
    target_differential_impedance_max:
      "targetDifferentialImpedanceMax" in props
        ? props.targetDifferentialImpedanceMax
        : undefined,
  })
}
