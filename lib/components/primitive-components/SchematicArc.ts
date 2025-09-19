import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicArcProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"

export class SchematicArc extends PrimitiveComponent<typeof schematicArcProps> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicArc",
      zodProps: schematicArcProps,
    }
  }

  schematic_arc_id?: string

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_component_id =
      this.getPrimitiveContainer()?.parent?.schematic_component_id!

    const schematic_arc = db.schematic_arc.insert({
      schematic_component_id,
      center: {
        x: props.center.x + globalPos.x,
        y: props.center.y + globalPos.y,
      },
      radius: props.radius,
      start_angle_degrees: props.startAngleDegrees,
      end_angle_degrees: props.endAngleDegrees,
      direction: props.direction,
      stroke_width: SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
      color: SCHEMATIC_COMPONENT_OUTLINE_COLOR,
      is_dashed: props.isDashed,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })

    this.schematic_arc_id = schematic_arc.schematic_arc_id
  }
}
