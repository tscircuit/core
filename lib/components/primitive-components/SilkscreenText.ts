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

    // Calculate accumulated rotation from parent transforms
    const globalTransform = this._computePcbGlobalTransformBeforeLayout()
    const decomposedTransform = decomposeTSR(globalTransform)
    let accumulatedRotation = (decomposedTransform.rotation.angle * 180) / Math.PI

    // When text is on bottom layer, adjust rotation to keep text readable
    if (isFlipped) {
      accumulatedRotation = (accumulatedRotation + 180) % 360
    }

    const uniqueLayers = new Set(props.layers)
    if (props.layer) uniqueLayers.add(props.layer)

    const targetLayers: LayerRef[] =
      uniqueLayers.size > 0 ? Array.from(uniqueLayers) : ["top"]

    for (const layer of targetLayers) {
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
        ccw_rotation: props.pcbRotation ?? accumulatedRotation,
        pcb_component_id: container.pcb_component_id!,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
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
