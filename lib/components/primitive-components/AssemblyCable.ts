import type { CadCable } from "circuit-json"
import { assemblyCableProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { resolveAssemblyCable } from "./resolve-assembly-cable"

export class AssemblyCable extends PrimitiveComponent<
  typeof assemblyCableProps
> {
  private cadCableId?: CadCable["cad_cable_id"]

  get config() {
    return { componentName: "AssemblyCable", zodProps: assemblyCableProps }
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled) return
    const cable = resolveAssemblyCable(this)
    this.cadCableId = this.root.db.cad_cable.insert(cable).cad_cable_id
  }

  updateCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.cadCableId) return
    this.root.db.cad_cable.update(this.cadCableId, resolveAssemblyCable(this))
  }
}
