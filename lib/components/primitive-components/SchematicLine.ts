import { schematicLineProps } from "@tscircuit/props"
import { convertColorName } from "lib/utils/colors"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"
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

  schematic_line_id?: string

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_component_id =
      this.getPrimitiveContainer()?.parent?.schematic_component_id!

    const schematic_line = db.schematic_line.insert({
      schematic_component_id,
      x1: props.x1 + globalPos.x,
      y1: props.y1 + globalPos.y,
      x2: props.x2 + globalPos.x,
      y2: props.y2 + globalPos.y,
      stroke_width:
        props.strokeWidth ?? SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
      color: convertColorName(props.color ?? SCHEMATIC_COMPONENT_OUTLINE_COLOR),
      is_dashed: false,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })

    this.schematic_line_id = schematic_line.schematic_line_id
  }
}
