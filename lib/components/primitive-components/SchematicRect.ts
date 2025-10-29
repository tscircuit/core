import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicRectProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"

export class SchematicRect extends PrimitiveComponent<
  typeof schematicRectProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicRect",
      zodProps: schematicRectProps,
    }
  }

  schematic_rect_id?: string

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_component_id =
      this.getPrimitiveContainer()?.parent?.schematic_component_id!

    const schematic_rect = db.schematic_rect.insert({
      center: {
        x: globalPos.x,
        y: globalPos.y,
      },
      width: props.width,
      height: props.height,
      stroke_width:
        props.strokeWidth ?? SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
      color: props.color ?? SCHEMATIC_COMPONENT_OUTLINE_COLOR,
      is_filled: props.isFilled,
      schematic_component_id,
      is_dashed: props.isDashed,
      rotation: props.rotation ?? 0,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
      corner_radius: props.cornerRadius ?? 0,
    })

    this.schematic_rect_id = schematic_rect.schematic_rect_id
  }
}
