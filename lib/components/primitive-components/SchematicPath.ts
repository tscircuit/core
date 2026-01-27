import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicPathProps } from "@tscircuit/props"

export class SchematicPath extends PrimitiveComponent<
  typeof schematicPathProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicPath",
      zodProps: schematicPathProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_component_id =
      this.getPrimitiveContainer()?.parent?.schematic_component_id!

    db.schematic_path.insert({
      schematic_component_id,
      points: props.points.map((point) => ({
        x: point.x + globalPos.x,
        y: point.y + globalPos.y,
      })),
      is_filled: props.isFilled,
      fill_color: props.fillColor,
      stroke_width: props.strokeWidth,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })
  }
}
