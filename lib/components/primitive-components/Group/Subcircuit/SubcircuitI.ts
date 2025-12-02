import type { PrimitiveComponent } from "../../../base-components/PrimitiveComponent"
import type { RootCircuit } from "../../../../RootCircuit"
import type { IGroup } from "../IGroup"

export interface SubcircuitI {
  subcircuit_id: string | null
  add(component: PrimitiveComponent): void
  root: RootCircuit | null
  getGroup(): IGroup | null
  source_group_id: string | null
}
