import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicRectProps } from "@tscircuit/props"
import {
  SCHEMATIC_COMPONENT_OUTLINE_COLOR,
  SCHEMATIC_COMPONENT_OUTLINE_STROKE_WIDTH,
} from "lib/utils/constants"
import { applyToPoint, decomposeTSR } from "transformation-matrix"

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

    // SymbolComponent applies axis-aligned scaling in schematic world mm
    // (+X right, +Y up). Quarter turns exchange the rectangle's local axes.
    const { scale } = decomposeTSR(transform)
    const isQuarterTurn = Math.abs((rect.rotation ?? 0) % 180) === 90

    db.schematic_rect.update(this.schematic_rect_id, {
      center: applyToPoint(transform, rect.center),
      width: rect.width * Math.abs(isQuarterTurn ? scale.sy : scale.sx),
      height: rect.height * Math.abs(isQuarterTurn ? scale.sx : scale.sy),
    })
  }
}
