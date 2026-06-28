import { schematicSheetProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"

export class SchematicSheet extends PrimitiveComponent<
  typeof schematicSheetProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicSheet",
      zodProps: schematicSheetProps,
    }
  }

  doInitialSourceGroupRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const schematicSheet = db.schematic_sheet.insert({
      name: props.name,
      display_name: props.displayName,
      sheet_index: props.sheetIndex,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    } as any)

    this.schematic_sheet_id = schematicSheet.schematic_sheet_id
  }

  doInitialSchematicSheetRender(): void {
    if (this.root?.schematicDisabled) return
    if (!this.schematic_sheet_id) return

    const { db } = this.root!
    const schematicElements = [
      ...db.schematic_component.list(),
      ...db.schematic_port.list(),
      ...db.schematic_text.list(),
      ...db.schematic_line.list(),
      ...db.schematic_rect.list(),
      ...db.schematic_circle.list(),
      ...db.schematic_arc.list(),
      ...db.schematic_path.list(),
    ].filter(
      (element) =>
        (element as any).schematic_sheet_id === this.schematic_sheet_id,
    )

    if (schematicElements.length === 0) return

    const bounds = getBoundsForSchematic(schematicElements)
    if (
      !Number.isFinite(bounds.minX) ||
      !Number.isFinite(bounds.maxX) ||
      !Number.isFinite(bounds.minY) ||
      !Number.isFinite(bounds.maxY)
    ) {
      return
    }

    db.schematic_sheet.update(this.schematic_sheet_id, {
      center: {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      },
    } as any)
  }
}
