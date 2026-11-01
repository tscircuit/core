import type { CadExplosionMove } from "circuit-json"
import { getRenderedAssemblyExplosionRecords } from "lib/assembly-explosion/get-rendered-assembly-explosion-records"
import { markAssemblyExplosionDirty } from "lib/assembly-explosion/mark-assembly-explosion-dirty"
import { assemblyExplosionMoveProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Straight translation instruction; displacement is resolved after mounting. */
export class AssemblyExplosionMove extends PrimitiveComponent<
  typeof assemblyExplosionMoveProps
> {
  cad_explosion_move_id: CadExplosionMove["cad_explosion_move_id"] | null = null

  get config() {
    return {
      componentName: "AssemblyExplosionMove",
      zodProps: assemblyExplosionMoveProps,
    }
  }

  override doInitialAssignNameToUnnamedComponents(): void {}

  doInitialSourceRender(): void {
    if (this.parent?.componentName !== "AssemblyExplosionStage") {
      throw new Error("An explosion move must belong to an explosion stage")
    }
  }

  onPropsChange(): void {
    markAssemblyExplosionDirty(this)
  }

  doInitialCadExplosionStageRender(): void {
    markAssemblyExplosionDirty(this)
  }

  doInitialCadExplosionRender(): void {
    if (!this.root || this.root.pcbDisabled || this.parent?.shouldBeRemoved)
      return
    const move = getRenderedAssemblyExplosionRecords(this).moves.get(this)!
    this.cad_explosion_move_id =
      this.root.db.cad_explosion_move.insert(move).cad_explosion_move_id
  }

  updateCadExplosionRender(): void {
    if (!this.root || this.root.pcbDisabled || this.parent?.shouldBeRemoved)
      return
    if (!this.cad_explosion_move_id) {
      this.doInitialCadExplosionRender()
      return
    }
    const move = getRenderedAssemblyExplosionRecords(this).moves.get(this)!
    this.root.db.cad_explosion_move.update(this.cad_explosion_move_id, move)
  }

  removeCadExplosionStageRender(): void {
    if (this.root && this.cad_explosion_move_id)
      this.root.db.cad_explosion_move.delete(this.cad_explosion_move_id)
    this.cad_explosion_move_id = null
    markAssemblyExplosionDirty(this)
  }
}
