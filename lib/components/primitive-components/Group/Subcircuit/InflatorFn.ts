import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceComponentBase } from "circuit-json"
import type { SubcircuitI } from "./SubcircuitI"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { Group } from "../Group"

export type SourceGroupId = string

export interface InflatorContext {
  injectionDb: CircuitJsonUtilObjects
  subcircuit: SubcircuitI & Pick<Group<any>, "_getSchematicLengthUnit">
  fromIsolatedCache: boolean

  schematicPlacement?: { schX: number; schY: number }
  normalComponent?: NormalComponent
  groupsMap?: Map<SourceGroupId, Group<any>>
}

export type InflatorFn<T extends SourceComponentBase> = (
  sourceElm: T,
  context: InflatorContext,
) => void
