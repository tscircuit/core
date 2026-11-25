import type { SourceBus, SourceBusRouteLength } from "circuit-json"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { InflatorContext, SourceTraceId } from "../InflatorFn"

class InflatedSourceBus extends PrimitiveComponent {
  constructor(
    private sourceBus: SourceBus,
    private inflatedSourceTraces: InflatorContext["inflatedSourceTraces"],
  ) {
    super({})
  }

  override get config() {
    return { ...super.config, componentName: "InflatedSourceBus" }
  }

  private remapSourceTraceIds(sourceTraceIds: SourceTraceId[] | undefined) {
    if (!sourceTraceIds) return
    const inflatedSourceTraceIds = new Set<SourceTraceId>()
    for (const sourceTraceId of sourceTraceIds) {
      const inflatedSourceTraceId =
        this.inflatedSourceTraces.get(sourceTraceId)?.source_trace_id
      if (!inflatedSourceTraceId) return
      inflatedSourceTraceIds.add(inflatedSourceTraceId)
    }
    return [...inflatedSourceTraceIds]
  }

  private remapRouteLength(length: SourceBusRouteLength | undefined) {
    if (typeof length !== "object" || !length.source_trace_ids) return length
    const source_trace_ids = this.remapSourceTraceIds(length.source_trace_ids)
    if (!source_trace_ids) return
    return { ...length, source_trace_ids }
  }

  /** Restore the bus once the inflated traces have their parent circuit IDs. */
  doInitialSourceDesignRuleChecks() {
    const {
      source_bus_id: _source_bus_id,
      differential_pair,
      ...sourceBus
    } = this.sourceBus
    const source_trace_ids = this.remapSourceTraceIds(
      sourceBus.source_trace_ids,
    )
    if (!source_trace_ids) return

    let differentialPair: SourceBus["differential_pair"]
    if (differential_pair) {
      const pairTraceIds = this.remapSourceTraceIds([
        differential_pair.positive_source_trace_id,
        differential_pair.negative_source_trace_id,
      ])
      if (pairTraceIds?.length !== 2) return
      const [positive_source_trace_id, negative_source_trace_id] = pairTraceIds
      differentialPair = {
        ...differential_pair,
        positive_source_trace_id,
        negative_source_trace_id,
      }
    }

    this.root!.db.source_bus.insert({
      ...sourceBus,
      source_trace_ids,
      differential_pair: differentialPair,
      length_match_source_trace_ids: this.remapSourceTraceIds(
        sourceBus.length_match_source_trace_ids,
      ),
      min_length: this.remapRouteLength(sourceBus.min_length),
      max_length: this.remapRouteLength(sourceBus.max_length),
      target_length: this.remapRouteLength(sourceBus.target_length),
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })
  }
}

export function inflateSourceBus(
  sourceBus: SourceBus,
  { subcircuit, inflatedSourceTraces }: InflatorContext,
) {
  subcircuit.add(new InflatedSourceBus(sourceBus, inflatedSourceTraces))
}
