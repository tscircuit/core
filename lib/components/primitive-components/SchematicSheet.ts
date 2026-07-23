import { schematicSheetProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { renderSchematicSheet } from "lib/utils/schematic/renderSchematicSheet"

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
    renderSchematicSheet({
      db,
      schematicSheetId: this.schematic_sheet_id,
      schematicSheetName: this._parsedProps.displayName,
    })
  }
}
