import { schematicGraphicProps } from "@tscircuit/props"
import type {
  Asset,
  SchematicGraphic as SchematicGraphicElement,
} from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SchematicGraphic extends PrimitiveComponent<
  typeof schematicGraphicProps
> {
  isSchematicPrimitive = true

  schematic_graphic_id?: SchematicGraphicElement["schematic_graphic_id"]

  get config() {
    return {
      componentName: "SchematicGraphic",
      zodProps: schematicGraphicProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return

    const { db } = this.root!
    const asset = {
      project_relative_path: "inline",
      url: `data:image/svg+xml,${encodeURIComponent(this._parsedProps.svgContent)}`,
      mimetype: "image/svg+xml",
    } satisfies Asset
    const schematicGraphic = db.schematic_graphic.insert({
      asset,
      schematic_sheet_id: this._resolveSchematicSheetId(),
    })

    this.schematic_graphic_id = schematicGraphic.schematic_graphic_id
  }
}
