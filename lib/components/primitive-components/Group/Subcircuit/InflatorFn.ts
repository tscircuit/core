import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceComponentBase } from "circuit-json"
import type { Subcircuit } from "./Subcircuit"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"

export interface InflatorContext {
  injectionDb: CircuitJsonUtilObjects
  subcircuit: Subcircuit

  normalComponent?: NormalComponent
}

export type InflatorFn<T extends SourceComponentBase> = (
  sourceElm: T,
  context: InflatorContext,
) => void
