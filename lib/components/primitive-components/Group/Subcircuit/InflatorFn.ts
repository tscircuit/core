import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbSilkscreenText, SourceComponentBase } from "circuit-json"
import type { SubcircuitI } from "./SubcircuitI"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { Group } from "../Group"

export type SourceGroupId = string

export interface InflatorContext {
  injectionDb: CircuitJsonUtilObjects
  subcircuit: SubcircuitI
  /**
   * Checks if label placement must leave the text where the circuit JSON puts
   * it: all the text of a circuitJson prop, whose layout already placed it, but
   * only the text an isolated subcircuit render placed by hand or by a rendered
   * layout, since that render is the same circuit rendered apart.
   */
  isPlacedPcbSilkscreenText: (pcbSilkscreenText: PcbSilkscreenText) => boolean

  normalComponent?: NormalComponent
  groupsMap?: Map<SourceGroupId, Group<any>>
}

export type InflatorFn<T extends SourceComponentBase> = (
  sourceElm: T,
  context: InflatorContext,
) => void
