import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicTextProps } from "@tscircuit/props"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import type { SymbolComponent } from "./Symbol"
import { applyToPoint } from "transformation-matrix"

export class SchematicText extends PrimitiveComponent<
  typeof schematicTextProps
> {
  isSchematicPrimitive = true

  schematic_text_id?: string

  get config() {
    return {
      componentName: "SchematicText",
      zodProps: schematicTextProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_text = db.schematic_text.insert({
      anchor: props.anchor ?? "center",
      text: normalizeTextForCircuitJson(props.text),
      font_size: props.fontSize,
      color: props.color || "#000000",
      position: {
        x: globalPos.x,
        y: globalPos.y,
      },
      rotation: props.schRotation ?? 0,
    })

    this.schematic_text_id = schematic_text.schematic_text_id
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
    if (!this.schematic_text_id) return

    const symbol = this._getSymbolAncestor()
    const transform = symbol?.getUserCoordinateToResizedSymbolTransform()
    if (!transform) return

    const { db } = this.root!
    const text = db.schematic_text.get(this.schematic_text_id)
    if (!text) return

    const newPosition = applyToPoint(transform, text.position)

    db.schematic_text.update(this.schematic_text_id, {
      position: { x: newPosition.x, y: newPosition.y },
    })
  }
}
