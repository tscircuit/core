import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export const schematicSheetProps = z
  .object({
    name: z.string().optional(),
    schematicSheetId: z.string().optional(),
    sheetIndex: z.number().optional(),
    sheet_index: z.number().optional(),
  })
  .passthrough()

export type SchematicSheetProps = z.input<typeof schematicSheetProps>

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
      ...(props.schematicSheetId
        ? { schematic_sheet_id: props.schematicSheetId }
        : {}),
      name: props.name,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
      sheet_index: props.sheetIndex ?? props.sheet_index,
    } as any)

    this.schematic_sheet_id = schematicSheet.schematic_sheet_id
  }
}
