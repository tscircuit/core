import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicCircleProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"

export class SchematicCircle extends PrimitiveComponent<
  typeof schematicCircleProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicCircle",
      zodProps: schematicCircleProps,
    }
  }

  schematic_circle_id?: string

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_component_id =
      this.getPrimitiveContainer()?.parent?.schematic_component_id!

    const schematic_circle = db.schematic_circle.insert({
      schematic_component_id,
      center: {
        x: props.center.x + globalPos.x,
        y: props.center.y + globalPos.y,
      },
      radius: props.radius,
      stroke_width: SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
      color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
      is_filled: props.isFilled,
      fill_color: props.fillColor,
      is_dashed: props.isDashed,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })

    this.schematic_circle_id = schematic_circle.schematic_circle_id
  }
}
