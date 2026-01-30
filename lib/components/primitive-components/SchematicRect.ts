import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicRectProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"
import type { SymbolComponent } from "./Symbol"
import { applyToPoint } from "transformation-matrix"

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
    })

    this.schematic_rect_id = schematic_rect.schematic_rect_id
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
    if (!this.schematic_rect_id) return

    const symbol = this._getSymbolAncestor()
    const transform = symbol?.getUserCoordinateToResizedSymbolTransform()
    if (!transform) return

    const { db } = this.root!
    const rect = db.schematic_rect.get(this.schematic_rect_id)
    if (!rect) return

    // Transform corner points to get new dimensions
    const topLeft = applyToPoint(transform, {
      x: rect.center.x - rect.width / 2,
      y: rect.center.y + rect.height / 2,
    })
    const bottomRight = applyToPoint(transform, {
      x: rect.center.x + rect.width / 2,
      y: rect.center.y - rect.height / 2,
    })

    const newWidth = Math.abs(bottomRight.x - topLeft.x)
    const newHeight = Math.abs(topLeft.y - bottomRight.y)
    const newCenter = {
      x: (topLeft.x + bottomRight.x) / 2,
      y: (topLeft.y + bottomRight.y) / 2,
    }

    db.schematic_rect.update(this.schematic_rect_id, {
      center: newCenter,
      width: newWidth,
      height: newHeight,
    })
  }
}
