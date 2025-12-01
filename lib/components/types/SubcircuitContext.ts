import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { RootCircuit } from "../../RootCircuit"
import type { IGroup } from "../primitive-components/Group/IGroup"

export interface SubcircuitContext {
  subcircuit_id: string | null
  add(component: PrimitiveComponent): void
  root: RootCircuit | null
  getGroup(): IGroup | null
}
