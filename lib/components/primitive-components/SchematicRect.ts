import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicRectProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"
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
    if (this.getCollapsedSchematicBoxAncestor()) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_component_id =
      this.getPrimitiveContainer()?.parent?.schematic_component_id!

    const schematic_symbol_id = this._getSymbolAncestor()?.schematic_symbol_id

    for (const [propertyName, value] of [
      ["width", props.width],
      ["height", props.height],
    ] as const) {
      if (typeof value === "number" && value <= 0) {
        db.source_invalid_component_property_error.insert({
          source_component_id: this.source_component_id || "",
          property_name: propertyName,
          message: `Invalid ${propertyName} for ${this.getString()}: ${value}, which must be greater than zero.`,
          error_type: "source_invalid_component_property_error",
        })
      }
    }

    const schematic_rect = db.schematic_rect.insert({
      schematic_symbol_id,
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
      schematic_sheet_id: this._resolveSchematicSheetId(),
    })

    this.schematic_rect_id = schematic_rect.schematic_rect_id
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

    // Symbol applies rotation after resizing. Column lengths preserve the
    // local-axis scales even when a quarter turn swaps the world axes.
    const scaleX = Math.hypot(transform.a, transform.b)
    const scaleY = Math.hypot(transform.c, transform.d)
    const rotation = (Math.atan2(transform.b, transform.a) * 180) / Math.PI

    db.schematic_rect.update(this.schematic_rect_id, {
      center: applyToPoint(transform, rect.center),
      width: rect.width * scaleX,
      height: rect.height * scaleY,
      rotation: (rect.rotation ?? 0) + rotation,
    })
  }
}
