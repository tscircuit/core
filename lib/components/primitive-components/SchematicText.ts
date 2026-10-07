import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicTextProps } from "@tscircuit/props"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import { resolveTextTemplate } from "lib/utils/resolve-text-template"
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
    if (this.getCollapsedSchematicBoxAncestor()) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_symbol_id = this._getSymbolAncestor()?.schematic_symbol_id
    const schematic_component_id =
      this.getParentNormalComponent()?.schematic_component_id ?? undefined

    const referenceDesignator = this.getParentNormalComponent()?.name
    const textParts = Array.isArray(props.text)
      ? props.text.map((textSpan) => ({
          text: normalizeTextForCircuitJson(
            resolveTextTemplate({
              text: textSpan.text,
              referenceDesignator,
            }),
          ),
          ...(textSpan.overline ? { is_overlined: true } : {}),
        }))
      : undefined
    const text = textParts
      ? textParts.map((textPart) => textPart.text).join("")
      : normalizeTextForCircuitJson(this._resolveText())

    const schematic_text = db.schematic_text.insert({
      schematic_symbol_id,
      schematic_component_id,
      anchor: props.anchor ?? "center",
      text,
      text_parts: textParts,
      font_size: props.fontSize,
      color: props.color || "#000000",
      position: {
        x: globalPos.x,
        y: globalPos.y,
      },
      rotation: props.schRotation ?? 0,
      schematic_sheet_id: this._resolveSchematicSheetId(),
    })

    this.schematic_text_id = schematic_text.schematic_text_id
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
