import { schematicSheetProps } from "@tscircuit/props"
import { centerSchematicSheetContents } from "lib/utils/schematic/center-schematic-sheet-contents"
import { insertSchematicElementOutsideSheetWarnings } from "lib/utils/schematic/insertSchematicElementOutsideSheetWarnings"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

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
    centerSchematicSheetContents({
      db,
      schematicSheetId: this.schematic_sheet_id,
    })

    insertSchematicElementOutsideSheetWarnings({
      db,
      schematicSheetId: this.schematic_sheet_id,
      schematicSheetName: this._parsedProps.displayName,
      schematicSheetCenter: { x: 0, y: 0 },
    })
  }
}
