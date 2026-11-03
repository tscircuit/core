import type { AssemblyBomProps } from "@tscircuit/props"
import type { CadAssemblyBomItem } from "circuit-json"
import type { z } from "zod"
import { PrimitiveComponent } from "./PrimitiveComponent"

type CadAssemblyBomItemId = CadAssemblyBomItem["cad_assembly_bom_item_id"]

/** Physical assembly material with BOM ownership independent of CAD geometry. */
export abstract class AssemblyComponent<
  ZodProps extends z.ZodType<
    AssemblyBomProps & { displayName?: string },
    z.ZodTypeDef,
    unknown
  >,
> extends PrimitiveComponent<ZodProps> {
  private cadAssemblyBomItemId?: CadAssemblyBomItemId

  protected get shouldRenderAssemblyBom() {
    return true
  }

  private getParentAssemblyBomId(): CadAssemblyBomItemId | undefined {
    let ancestor = this.parent
    while (ancestor) {
      if (
        ancestor instanceof AssemblyComponent &&
        ancestor.shouldRenderAssemblyBom
      )
        return ancestor.ensureAssemblyBomItem()
      ancestor = ancestor.parent
    }
  }

  // Render phases visit children first, so allocate parent identity on demand.
  private ensureAssemblyBomItem(): CadAssemblyBomItemId | undefined {
    if (!this.root || !this.shouldRenderAssemblyBom) return
    if (!this.cadAssemblyBomItemId) {
      this.cadAssemblyBomItemId = this.root.db.cad_assembly_bom_item.insert({
        name: this._parsedProps.displayName || this.name || "Unnamed assembly",
        quantity: 1,
        parent_cad_assembly_bom_item_id: this.getParentAssemblyBomId(),
      }).cad_assembly_bom_item_id
    }
    return this.cadAssemblyBomItemId
  }

  doInitialCadAssemblyBomRender(): void {
    if (!this.root) return
    if (!this.shouldRenderAssemblyBom) {
      if (this.cadAssemblyBomItemId)
        this.root.db.cad_assembly_bom_item.delete(this.cadAssemblyBomItemId)
      this.cadAssemblyBomItemId = undefined
      return
    }
    const cadAssemblyBomItemId = this.ensureAssemblyBomItem()!
    const cadComponentIds = this.source_component_id
      ? this.root.db.cad_component
          .list()
          .filter((cad) => cad.source_component_id === this.source_component_id)
          .map((cad) => cad.cad_component_id)
      : []
    this.root.db.cad_assembly_bom_item.update(cadAssemblyBomItemId, {
      name: this._parsedProps.displayName || this.name || "Unnamed assembly",
      quantity: 1,
      parent_cad_assembly_bom_item_id: this.getParentAssemblyBomId(),
      source_component_id: this.source_component_id ?? undefined,
      cad_component_ids: cadComponentIds.length ? cadComponentIds : undefined,
      supplier_part_numbers: this._parsedProps.supplierPartNumbers,
      purchase_urls: this._parsedProps.purchaseUrls,
    })
  }

  updateCadAssemblyBomRender(): void {
    this.doInitialCadAssemblyBomRender()
  }

  removeCadAssemblyBomRender(): void {
    super.removeCadAssemblyBomRender()
    if (this.root && this.cadAssemblyBomItemId)
      this.root.db.cad_assembly_bom_item.delete(this.cadAssemblyBomItemId)
    this.cadAssemblyBomItemId = undefined
  }

  onPropsChange(): void {
    this._markDirty("CadAssemblyBomRender")
    // A transparent device can acquire/lose a BOM line; descendants must reparent.
    const markDescendants = (parent: PrimitiveComponent) => {
      for (const child of parent.children) {
        child._markDirty("CadAssemblyBomRender")
        markDescendants(child)
      }
    }
    markDescendants(this)
  }
}
