import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceComponentBase, SourceNet } from "circuit-json"
import type { SubcircuitI } from "./SubcircuitI"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { Group } from "../Group"

export type SourceGroupId = string
export type SourceSubcircuitId = NonNullable<SourceNet["subcircuit_id"]>

export interface InflatorContext {
  injectionDb: CircuitJsonUtilObjects
  subcircuit: SubcircuitI

  normalComponent?: NormalComponent
  groupsMap?: Map<SourceGroupId, Group<any>>
  netClassSubcircuits?: Map<SourceSubcircuitId, Group<any>>
}

export type InflatorFn<T extends SourceComponentBase> = (
  sourceElm: T,
  context: InflatorContext,
) => void
