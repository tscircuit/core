import type { SourceBus } from "circuit-json"
import { getBusSourceTraceIdOrThrow } from "lib/utils/autorouting/getBusSourceTraceIdOrThrow"
import { busProps } from "@tscircuit/props"
import {
  type BaseComponentConfig,
  PrimitiveComponent,
} from "../base-components/PrimitiveComponent"

/**
 * Declares a group of connections that an autorouter should keep together.
 */
export class Bus extends PrimitiveComponent<typeof busProps> {
  source_bus_id?: SourceBus["source_bus_id"]

  override get config(): BaseComponentConfig {
    return {
      componentName: "Bus",
      zodProps: busProps,
    }
  }

  // This phase follows SourceTraceRender for every component, including traces
  // declared after the bus. It also runs when PCB routing is disabled.
  doInitialSourceAddConnectivityMapKey(): void {
    const { db } = this.root!
    const subcircuit_id = this.getSubcircuit().subcircuit_id!
    const busSourceTraces = db.source_trace
      .list()
      .filter((sourceTrace) => sourceTrace.subcircuit_id === subcircuit_id)
    const source_trace_ids = this._parsedProps.connections.map(
      (traceNameOrPortSelector) =>
        getBusSourceTraceIdOrThrow({
          bus: this,
          busSourceTraces,
          traceNameOrPortSelector,
        }),
    )
    if (new Set(source_trace_ids).size !== source_trace_ids.length) {
      throw new Error(
        `Bus "${this.name}" resolves multiple entries to one trace`,
      )
    }
    const sourceBus = db.source_bus.insert({
      name: this._parsedProps.name,
      source_trace_ids,
      max_length_skew: this._parsedProps.maxLengthSkew,
      subcircuit_id,
    })
    this.source_bus_id = sourceBus.source_bus_id
  }
}
