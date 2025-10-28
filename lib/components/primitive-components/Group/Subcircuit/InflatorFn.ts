import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceComponentBase } from "circuit-json"
import type { Subcircuit } from "./Subcircuit"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { Group } from "../Group"

export type SourceGroupId = string

export interface InflatorContext {
  injectionDb: CircuitJsonUtilObjects
  subcircuit: Subcircuit

  normalComponent?: NormalComponent
  groupsMap?: Map<SourceGroupId, Group<any>>
}

export type InflatorFn<T extends SourceComponentBase> = (
  sourceElm: T,
  context: InflatorContext,
) => void
