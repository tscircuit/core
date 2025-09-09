import { schematicLineProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SchematicLine extends PrimitiveComponent<
  typeof schematicLineProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicLine",
      zodProps: schematicLineProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const offset = this._getGlobalSchematicPositionBeforeLayout()

    db.schematic_line.insert({
      x1: offset.x + props.x1,
      y1: offset.y + props.y1,
      x2: offset.x + props.x2,
      y2: offset.y + props.y2,
    })
  }
}
