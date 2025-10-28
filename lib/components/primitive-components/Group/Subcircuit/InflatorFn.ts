import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceComponentBase } from "circuit-json"
import type { Subcircuit } from "./Subcircuit"

export interface InflatorContext {
  injectionDb: CircuitJsonUtilObjects
  subcircuit: Subcircuit
}

export type InflatorFn<T extends SourceComponentBase> = (
  sourceElm: T,
  context: InflatorContext,
) => void
