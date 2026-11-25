import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceComponentBase, SourceTrace } from "circuit-json"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import type { SubcircuitI } from "./SubcircuitI"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { Group } from "../Group"

export type SourceGroupId = string
export type SourceTraceId = SourceTrace["source_trace_id"]

export interface InflatorContext {
  injectionDb: CircuitJsonUtilObjects
  subcircuit: SubcircuitI
  inflatedSourceTraces: Map<SourceTraceId, Trace>

  normalComponent?: NormalComponent
  groupsMap?: Map<SourceGroupId, Group<any>>
}

export type InflatorFn<T extends SourceComponentBase> = (
  sourceElm: T,
  context: InflatorContext,
) => void
