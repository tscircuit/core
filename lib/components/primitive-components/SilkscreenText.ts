import type { LayerRef } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { silkscreenTextProps } from "@tscircuit/props"
import { decomposeTSR } from "transformation-matrix"

export class SilkscreenText extends PrimitiveComponent<
  typeof silkscreenTextProps
> {
  isPcbPrimitive = true

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

    for (const layer of targetLayers) {
      let knockout_padding = undefined
      if (props.isKnockout && (
        props.knockoutPadding ||
        props.knockoutPaddingLeft ||
        props.knockoutPaddingRight ||
        props.knockoutPaddingTop ||
        props.knockoutPaddingBottom
      )) {
        const defaultPadding = props.knockoutPadding ?? "0.2mm"
        knockout_padding = {
          left: props.knockoutPaddingLeft ?? defaultPadding,
          right: props.knockoutPaddingRight ?? defaultPadding,
          top: props.knockoutPaddingTop ?? defaultPadding,
          bottom: props.knockoutPaddingBottom ?? defaultPadding,
        }
      }

      db.pcb_silkscreen_text.insert({
        anchor_alignment: props.anchorAlignment,
        anchor_position: {
          x: position.x,
          y: position.y,
        },
        font: props.font ?? "tscircuit2024",
        font_size: props.fontSize ?? 1,
        layer: maybeFlipLayer(layer) as "top" | "bottom",
        text: props.text ?? "",
        ccw_rotation: rotation,
        pcb_component_id: container.pcb_component_id!,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        is_knockout: props.isKnockout ?? false,
        knockout_padding,
        ...(props.knockoutCornerRadius && { knockout_corner_radius: props.knockoutCornerRadius }),
        ...(props.knockoutBorderWidth && { knockout_border_width: props.knockoutBorderWidth }),
        ...(props.knockoutColor && { knockout_color: props.knockoutColor }),
      })
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const fontSize = props.fontSize ?? 1
    const text = props.text ?? ""
    const textWidth = text.length * fontSize
    const textHeight = fontSize
    return { width: textWidth * fontSize, height: textHeight * fontSize }
  }
}
