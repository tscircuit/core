import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicTextProps } from "@tscircuit/props"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"

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
      text: normalizeTextForCircuitJson(props.text),
      font_size: props.fontSize,
      color: props.color || "#000000",
      position: {
        x: globalPos.x,
        y: globalPos.y,
      },
      rotation: props.schRotation ?? 0,
    })
  }
}
