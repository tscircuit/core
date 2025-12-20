import type { LayerRef } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { silkscreenTextProps } from "@tscircuit/props"
import { decomposeTSR } from "transformation-matrix"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"

export class SilkscreenText extends PrimitiveComponent<
  typeof silkscreenTextProps
> {
  pcb_silkscreen_text_ids: string[] = []
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

    // Get font size from props, inherited pcbStyle, or default to 1
    const fontSize =
      props.fontSize ??
      this.getInheritedProperty("pcbStyle")?.silkscreenFontSize ??
      1

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
      })
      this.pcb_silkscreen_text_ids.push(
        pcb_silkscreen_text.pcb_silkscreen_text_id,
      )
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const fontSize =
      props.fontSize ??
      this.getInheritedProperty("pcbStyle")?.silkscreenFontSize ??
      1
    const text = props.text ?? ""
    const textWidth = text.length * fontSize
    const textHeight = fontSize
    return { width: textWidth * fontSize, height: textHeight * fontSize }
  }

  _repositionOnPcb({ deltaX, deltaY }: { deltaX: number; deltaY: number }) {
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
