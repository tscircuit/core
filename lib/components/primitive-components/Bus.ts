import type { SourceBus } from "circuit-json"
import { getBusSourceTraceIdOrThrow } from "lib/utils/autorouting/getBusSourceTraceIdOrThrow"
import { busProps } from "@tscircuit/props"
import { getSourceBusRouteLength } from "lib/utils/autorouting/getSourceBusRouteLength"
import type { DifferentialPair } from "./DifferentialPair"
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
    const lengthMatchTo = this._parsedProps.lengthMatchTo
    const matchingSelectors =
      typeof lengthMatchTo === "string"
        ? [lengthMatchTo]
        : (lengthMatchTo ?? [])
    const matchingSourceTraceIds = matchingSelectors.flatMap((selector) => {
      const subcircuit = this.getSubcircuit()
      const selectedBus =
        subcircuit.selectAll<Bus>("bus").find((bus) => bus.name === selector) ??
        subcircuit.selectOne<Bus>(selector, { type: "bus" })
      const selectedPair =
        subcircuit
          .selectAll<DifferentialPair>("differentialpair")
          .find((pair) => pair.name === selector) ??
        subcircuit.selectOne<DifferentialPair>(selector, {
          type: "differentialpair",
        })
      const traceSelectors = selectedBus
        ? selectedBus._parsedProps.connections
        : selectedPair
          ? [
              selectedPair._parsedProps.positiveConnection,
              selectedPair._parsedProps.negativeConnection,
            ]
          : [selector]
      return traceSelectors.map((traceNameOrPortSelector) =>
        getBusSourceTraceIdOrThrow({
          bus: this,
          busSourceTraces,
          traceNameOrPortSelector,
        }),
      )
    })
    const sourceBus = db.source_bus.insert({
      name: this._parsedProps.name,
      source_trace_ids: [
        ...new Set([...source_trace_ids, ...matchingSourceTraceIds]),
      ],
      max_length_skew: this._parsedProps.maxLengthSkew,
      min_length: getSourceBusRouteLength({
        bus: this,
        busSourceTraces,
        property: "minLength",
      }),
      max_length: getSourceBusRouteLength({
        bus: this,
        busSourceTraces,
        property: "maxLength",
      }),
      target_length: getSourceBusRouteLength({
        bus: this,
        busSourceTraces,
        property: "targetLength",
      }),
      length_tolerance: this._parsedProps.lengthTolerance,
      subcircuit_id,
    })
    this.source_bus_id = sourceBus.source_bus_id
  }
}
