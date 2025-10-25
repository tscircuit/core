import { schematicTextProps } from "@tscircuit/props"
import { convertColorName } from "lib/utils/colors/convert-color-name"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SchematicText extends PrimitiveComponent<
  typeof schematicTextProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicText",
      zodProps: schematicTextProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    db.schematic_text.insert({
      anchor: props.anchor ?? "center",
      text: props.text,
      font_size: props.fontSize,
      color: convertColorName(props.color || "#000000"),
      position: {
        x: globalPos.x,
        y: globalPos.y,
      },
      rotation: props.schRotation ?? 0,
    })
  }
}
