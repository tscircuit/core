import { schematicSheetProps } from "@tscircuit/props"
import type { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SchematicSheet extends PrimitiveComponent<
  typeof schematicSheetProps
> {
  isSchematicPrimitive = true
  schematic_sheet_id?: string

  constructor(props: z.input<typeof schematicSheetProps>) {
    super({
      ...props,
      displayName: props.displayName ?? props.name,
    })
  }

  get config() {
    return {
      componentName: "SchematicSheet",
      zodProps: schematicSheetProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return

    const sheetSubcircuit = this.children.find((child) => child.isSubcircuit)
    const subcircuitId =
      sheetSubcircuit?.getSubcircuit().subcircuit_id ??
      this.getSubcircuit().subcircuit_id ??
      undefined

    const schematicSheet = this.root!.db.schematic_sheet.insert({
      name: this._parsedProps.name,
      subcircuit_id: subcircuitId,
    })

    this.schematic_sheet_id = schematicSheet.schematic_sheet_id
  }
}
