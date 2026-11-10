import type { CadCable } from "circuit-json"
import { assemblyCableProps } from "@tscircuit/props"
import { AssemblyComponent } from "../base-components/AssemblyComponent"
import { resolveAssemblyCable } from "./resolve-assembly-cable"

export class AssemblyCable extends AssemblyComponent<
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

  onPropsChange(): void {
    super.onPropsChange()
    this._markDirty("CadModelRender")
  }

  updateCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.cadCableId) return
    this.root.db.cad_cable.update(this.cadCableId, resolveAssemblyCable(this))
  }
}
