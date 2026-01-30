import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicArcProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"
import type { SymbolComponent } from "./Symbol"
import { applyToPoint } from "transformation-matrix"

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
      stroke_width:
        props.strokeWidth ?? SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
      color: props.color ?? SCHEMATIC_COMPONENT_OUTLINE_COLOR,
      is_dashed: props.isDashed,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })

    this.schematic_arc_id = schematic_arc.schematic_arc_id
  }

  _getSymbolAncestor(): SymbolComponent | null {
    const container = this.getPrimitiveContainer()
    if (container?.componentName === "Symbol") {
      return container as SymbolComponent
    }
    return null
  }

  doInitialSchematicSymbolResize(): void {
    if (this.root?.schematicDisabled) return
    if (!this.schematic_arc_id) return

    const symbol = this._getSymbolAncestor()
    const transform = symbol?.getUserCoordinateToResizedSymbolTransform()
    if (!transform) return

    const { db } = this.root!
    const arc = db.schematic_arc.get(this.schematic_arc_id)
    if (!arc) return

    const newCenter = applyToPoint(transform, arc.center)
    // Transform a point on the edge to compute new radius
    const edgePoint = applyToPoint(transform, {
      x: arc.center.x + arc.radius,
      y: arc.center.y,
    })
    const newRadius = Math.abs(edgePoint.x - newCenter.x)

    db.schematic_arc.update(this.schematic_arc_id, {
      center: { x: newCenter.x, y: newCenter.y },
      radius: newRadius,
    })
  }
}
