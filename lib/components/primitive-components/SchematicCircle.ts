import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicCircleProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"
import { applyToPoint } from "transformation-matrix"

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

    const schematic_symbol_id = this._getSymbolAncestor()?.schematic_symbol_id

    const schematic_circle = db.schematic_circle.insert({
      schematic_component_id,
      schematic_symbol_id,
      center: {
        x: props.center.x + globalPos.x,
        y: props.center.y + globalPos.y,
      },
      radius: props.radius,
      stroke_width:
        props.strokeWidth ?? SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
      color: props.color ?? SCHEMATIC_COMPONENT_OUTLINE_COLOR,
      is_filled: props.isFilled,
      fill_color: props.fillColor,
      is_dashed: props.isDashed,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })

    this.schematic_circle_id = schematic_circle.schematic_circle_id
  }

  doInitialSchematicSymbolResize(): void {
    if (this.root?.schematicDisabled) return
    if (!this.schematic_circle_id) return

    const symbol = this._getSymbolAncestor()
    const transform = symbol?.getUserCoordinateToResizedSymbolTransform()
    if (!transform) return

    const { db } = this.root!
    const circle = db.schematic_circle.get(this.schematic_circle_id)
    if (!circle) return

    const newCenter = applyToPoint(transform, circle.center)
    // Transform a point on the edge to compute new radius
    const edgePoint = applyToPoint(transform, {
      x: circle.center.x + circle.radius,
      y: circle.center.y,
    })
    const newRadius = Math.abs(edgePoint.x - newCenter.x)

    db.schematic_circle.update(this.schematic_circle_id, {
      center: { x: newCenter.x, y: newCenter.y },
      radius: newRadius,
    })
  }
}
