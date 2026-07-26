import { schematicSheetProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { insertSchematicElementOutsideSheetWarnings } from "lib/utils/schematic/insertSchematicElementOutsideSheetWarnings"

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

    let schematicSheetCenter = { x: 0, y: 0 }
    if (schematicElements.length > 0) {
      const bounds = getBoundsForSchematic(schematicElements)
      if (
        Number.isFinite(bounds.minX) &&
        Number.isFinite(bounds.maxX) &&
        Number.isFinite(bounds.minY) &&
        Number.isFinite(bounds.maxY)
      ) {
        schematicSheetCenter = {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
        }

        db.schematic_sheet.update(this.schematic_sheet_id, {
          center: schematicSheetCenter,
        } as any)
      }
    }

    insertSchematicElementOutsideSheetWarnings({
      db,
      schematicSheetId: this.schematic_sheet_id,
      schematicSheetName: this._parsedProps.displayName,
      schematicSheetCenter,
    })
  }
}
