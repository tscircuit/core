import type { LayerRef } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { silkscreenTextProps } from "@tscircuit/props"
import { decomposeTSR } from "transformation-matrix"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import { resolvePcbProperty } from "lib/utils/pcbSx/resolve-pcb-property"

export class SilkscreenText extends PrimitiveComponent<
  typeof silkscreenTextProps
> {
  pcb_silkscreen_text_ids: string[] = []
  isPcbPrimitive = true
  _footprinterFontSize?: number

  get config() {
    return {
      componentName: "SilkscreenText",
      zodProps: silkscreenTextProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const container = this.getPrimitiveContainer()!

    const position = this._getGlobalPcbPositionBeforeLayout()
    const { maybeFlipLayer, isFlipped } = this._getPcbPrimitiveFlippedHelpers()
    const subcircuit = this.getSubcircuit()

    // Calculate rotation for silkscreen text
    let rotation = 0

    // If the component has an explicit rotation, use that
    if (props.pcbRotation !== undefined && props.pcbRotation !== 0) {
      rotation = props.pcbRotation
    } else {
      // Otherwise, check for parent group rotations
      const globalTransform = this._computePcbGlobalTransformBeforeLayout()
      const decomposedTransform = decomposeTSR(globalTransform)
      rotation = (decomposedTransform.rotation.angle * 180) / Math.PI
    }
    // When text is on bottom layer, adjust rotation to keep text readable
    if (isFlipped) {
      rotation = (rotation + 180) % 360
    }

    const uniqueLayers = new Set(props.layers)
    if (props.layer) uniqueLayers.add(props.layer)

    const targetLayers: LayerRef[] =
      uniqueLayers.size > 0 ? Array.from(uniqueLayers) : ["top"]

    // Font size priority: explicit prop > resolvedPcbSx > pcbStyle > footprinter default > 1
    const resolvedPcbSxFontSize = resolvePcbProperty({
      propertyName: "fontSize",
      resolvedPcbSx: this.getResolvedPcbSx(),
      pathFromAmpersand: "silkscreentext",
      component: this,
    }) as number | undefined

    const fontSize =
      props.fontSize ??
      resolvedPcbSxFontSize ??
      this.getInheritedProperty("pcbStyle")?.silkscreenFontSize ??
      this._footprinterFontSize ??
      1

    // Build knockout padding object from uniform or individual padding props
    const uniformPadding = props.knockoutPadding ?? 0
    const hasKnockoutPadding =
      props.knockoutPadding !== undefined ||
      props.knockoutPaddingLeft !== undefined ||
      props.knockoutPaddingRight !== undefined ||
      props.knockoutPaddingTop !== undefined ||
      props.knockoutPaddingBottom !== undefined

    const knockoutPadding = hasKnockoutPadding
      ? {
          left: props.knockoutPaddingLeft ?? uniformPadding,
          right: props.knockoutPaddingRight ?? uniformPadding,
          top: props.knockoutPaddingTop ?? uniformPadding,
          bottom: props.knockoutPaddingBottom ?? uniformPadding,
        }
      : undefined

    for (const layer of targetLayers) {
      const pcb_silkscreen_text = db.pcb_silkscreen_text.insert({
        anchor_alignment: props.anchorAlignment,
        anchor_position: {
          x: position.x,
          y: position.y,
        },
        font: props.font ?? "tscircuit2024",
        font_size: fontSize,
        layer: maybeFlipLayer(layer) as "top" | "bottom",
        text: normalizeTextForCircuitJson(props.text ?? ""),
        ccw_rotation: rotation,
        pcb_component_id: container.pcb_component_id!,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        is_knockout: props.isKnockout,
        knockout_padding: knockoutPadding,
      })
      this.pcb_silkscreen_text_ids.push(
        pcb_silkscreen_text.pcb_silkscreen_text_id,
      )
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this

    const resolvedPcbSxFontSize = resolvePcbProperty({
      propertyName: "fontSize",
      resolvedPcbSx: this.getResolvedPcbSx(),
      pathFromAmpersand: "silkscreentext",
      component: this,
    }) as number | undefined

    const fontSize =
      props.fontSize ??
      resolvedPcbSxFontSize ??
      this.getInheritedProperty("pcbStyle")?.silkscreenFontSize ??
      this._footprinterFontSize ??
      1
    const text = props.text ?? ""
    const textWidth = text.length * fontSize
    const textHeight = fontSize
    return { width: textWidth * fontSize, height: textHeight * fontSize }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!

    for (const id of this.pcb_silkscreen_text_ids) {
      const text = db.pcb_silkscreen_text.get(id)
      if (text) {
        db.pcb_silkscreen_text.update(id, {
          anchor_position: {
            x: text.anchor_position.x + deltaX,
            y: text.anchor_position.y + deltaY,
          },
        })
      }
    }
  }
}
