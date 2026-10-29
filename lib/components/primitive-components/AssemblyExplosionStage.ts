import type { AssemblyExplosionMove } from "./AssemblyExplosionMove"
import type { CadExplosionStage } from "circuit-json"
import { getRenderedAssemblyExplosionRecords } from "lib/assembly-explosion/get-rendered-assembly-explosion-records"
import { markAssemblyExplosionDirty } from "lib/assembly-explosion/mark-assembly-explosion-dirty"
import { assemblyPath } from "lib/assembly-explosion/get-assembly-explosion"
import { assemblyExplosionStageProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Instruction metadata; adds no electrical or CAD geometry. */
export class AssemblyExplosionStage extends PrimitiveComponent<
  typeof assemblyExplosionStageProps
> {
  cad_explosion_stage_id: CadExplosionStage["cad_explosion_stage_id"] | null =
    null

  get config() {
    return {
      componentName: "AssemblyExplosionStage",
      zodProps: assemblyExplosionStageProps,
    }
  }

  doInitialSourceRender(): void {
    if (
      this.parent?.componentName !== "AssemblyDevice" &&
      this.parent?.componentName !== "AssemblySubassembly"
    ) {
      throw new Error(
        `Explosion stage "${this.name}" must belong to an assembly device or subassembly`,
      )
    }
    if (
      this.children.some(
        (child) => child.componentName !== "AssemblyExplosionMove",
      )
    ) {
      throw new Error(
        `Explosion stage "${this.name}" can contain only explosion moves`,
      )
    }
  }

  onPropsChange(): void {
    markAssemblyExplosionDirty(this)
  }

  doInitialCadExplosionStageRender(): void {
    if (!this.root || this.root.pcbDisabled) return
    // Allocate identity before any movement resolves forward stage references.
    this.cad_explosion_stage_id = this.root.db.cad_explosion_stage.insert({
      name: `${assemblyPath(this.parent!)}.${this.name}`,
      order: 0,
      cad_component_ids: [],
      cad_reference_surface_ids: [],
    }).cad_explosion_stage_id
    markAssemblyExplosionDirty(this)
  }

  doInitialCadExplosionRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.cad_explosion_stage_id)
      return
    const stage = getRenderedAssemblyExplosionRecords(this).stages.get(this)!
    this.root.db.cad_explosion_stage.update(this.cad_explosion_stage_id, stage)
  }

  updateCadExplosionRender(): void {
    this.doInitialCadExplosionRender()
  }

  removeCadExplosionStageRender(): void {
    if (!this.root || !this.cad_explosion_stage_id) return
    // Removing a stage also removes its owned movements, even when only the
    // parent has been marked for removal by the caller.
    for (const move of this.children as AssemblyExplosionMove[])
      move.removeCadExplosionStageRender()
    this.root.db.cad_explosion_stage.delete(this.cad_explosion_stage_id)
    this.cad_explosion_stage_id = null
    markAssemblyExplosionDirty(this)
  }
}
