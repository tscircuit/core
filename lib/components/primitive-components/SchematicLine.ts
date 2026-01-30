import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicLineProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"
import { applyToPoint } from "transformation-matrix"

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
      color: props.color ?? SCHEMATIC_COMPONENT_OUTLINE_COLOR,
      is_dashed: false,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })

    this.schematic_line_id = schematic_line.schematic_line_id
  }

  doInitialSchematicSymbolResize(): void {
    if (this.root?.schematicDisabled) return
    if (!this.schematic_line_id) return

    const symbol = this._getSymbolAncestor()
    const transform = symbol?.getUserCoordinateToResizedSymbolTransform()
    if (!transform) return

    const { db } = this.root!
    const line = db.schematic_line.get(this.schematic_line_id)
    if (!line) return

    const p1 = applyToPoint(transform, { x: line.x1, y: line.y1 })
    const p2 = applyToPoint(transform, { x: line.x2, y: line.y2 })

    db.schematic_line.update(this.schematic_line_id, {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
    })
  }
}
