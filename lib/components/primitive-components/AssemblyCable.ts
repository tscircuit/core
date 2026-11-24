import type { CadAssemblyBomItem, CadCable, CadCableWire } from "circuit-json"
import { assemblyCableProps } from "@tscircuit/props"
import { AssemblyComponent } from "../base-components/AssemblyComponent"
import {
  getAssemblyCableBomParts,
  type AssemblyCableBomPart,
} from "./get-assembly-cable-bom-parts"
import { resolveAssemblyCable } from "./resolve-assembly-cable"
import { resolveAssemblyCableWires } from "./resolve-assembly-cable-wires"

export class AssemblyCable extends AssemblyComponent<
  typeof assemblyCableProps
> {
  private cadCableId?: CadCable["cad_cable_id"]
  private cadCableWireIds: CadCableWire["cad_cable_wire_id"][] = []
  /** Derived material lines of a wired cable, with their BOM records. */
  cableBomItems: (AssemblyCableBomPart &
    Pick<CadAssemblyBomItem, "cad_assembly_bom_item_id">)[] = []

  get config() {
    return { componentName: "AssemblyCable", zodProps: assemblyCableProps }
  }

  get cad_cable_id() {
    return this.cadCableId
  }

  private renderCable() {
    const { db } = this.root!
    const cable = resolveAssemblyCable(this)
    const wires = resolveAssemblyCableWires(this, cable.cableprinter_string)
    if (this.cadCableId) db.cad_cable.update(this.cadCableId, cable)
    else this.cadCableId = db.cad_cable.insert(cable).cad_cable_id
    for (const id of this.cadCableWireIds) db.cad_cable_wire.delete(id)
    this.cadCableWireIds = wires.map(
      (wire) =>
        db.cad_cable_wire.insert({ ...wire, cad_cable_id: this.cadCableId! })
          .cad_cable_wire_id,
    )
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled) return
    this.renderCable()
  }

  onPropsChange(): void {
    super.onPropsChange()
    this._markDirty("CadModelRender")
  }

  updateCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.cadCableId) return
    this.renderCable()
  }

  private removeCableBomItems() {
    for (const item of this.cableBomItems)
      this.root?.db.cad_assembly_bom_item.delete(item.cad_assembly_bom_item_id)
    this.cableBomItems = []
  }

  /** A wired cable is built from parts, so its BOM line gains one child per
   * housing, contact and wire type. An unwired cable stays a single line. */
  doInitialCadAssemblyBomRender(): void {
    super.doInitialCadAssemblyBomRender()
    if (!this.root) return
    const { db } = this.root
    this.removeCableBomItems()
    const cable = this.cadCableId ? db.cad_cable.get(this.cadCableId) : null
    if (!cable || !this.cad_assembly_bom_item_id) return
    const wires = db.cad_cable_wire
      .list()
      .filter((wire) => wire.cad_cable_id === cable.cad_cable_id)
    this.cableBomItems = getAssemblyCableBomParts(cable, wires).map((part) => ({
      ...part,
      cad_assembly_bom_item_id: db.cad_assembly_bom_item.insert({
        name: part.name,
        quantity: part.quantity,
        parent_cad_assembly_bom_item_id: this.cad_assembly_bom_item_id,
      }).cad_assembly_bom_item_id,
    }))
  }

  removeCadAssemblyBomRender(): void {
    this.removeCableBomItems()
    super.removeCadAssemblyBomRender()
  }
}
