import type { IsolatedCircuit } from "../../../../IsolatedCircuit"
import type { PrimitiveComponent } from "../../../base-components/PrimitiveComponent"
import type { IGroup } from "../IGroup"

export interface SubcircuitI {
  subcircuit_id: string | null
  add(component: PrimitiveComponent): void
  root: IsolatedCircuit | null
  getGroup(): IGroup | null
  source_group_id: string | null
}
