import { copperTextProps } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import { decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class CopperText extends PrimitiveComponent<typeof copperTextProps> {
  isPcbPrimitive = true
  pcb_copper_text_id: string | null = null
  pcb_copper_text_ids: string[] = []

  get config() {
    return {
      componentName: "CopperText",
      zodProps: copperTextProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const container = this.getPrimitiveContainer()
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const { maybeFlipLayer, isFlipped } = this._getPcbPrimitiveFlippedHelpers()

    const globalTransform = this._computePcbGlobalTransformBeforeLayout()
    const rawRotation =
      (decomposeTSR(globalTransform, false, isFlipped).rotation.angle * 180) /
      Math.PI
    const normalizedRotation = ((rawRotation % 360) + 360) % 360
    const ccwRotation =
      Math.abs(normalizedRotation) < 1e-8 ||
      Math.abs(normalizedRotation - 360) < 1e-8
        ? 0
        : normalizedRotation

    const uniqueLayers = new Set<LayerRef>(props.layers)
    if (props.layer) uniqueLayers.add(props.layer)
    const targetLayers: LayerRef[] =
      uniqueLayers.size > 0 ? Array.from(uniqueLayers) : ["top"]

    for (const rawLayer of targetLayers) {
      const pcb_copper_text = db.pcb_copper_text.insert({
        anchor_alignment: props.anchorAlignment,
        anchor_position: {
          x: position.x,
          y: position.y,
        },
        font: props.font ?? "tscircuit2024",
        font_size: props.fontSize!,
        layer: maybeFlipLayer(rawLayer),
        text: normalizeTextForCircuitJson(props.text),
        ccw_rotation: ccwRotation,
        is_mirrored:
          props.mirrored !== undefined
            ? isFlipped
              ? !props.mirrored
              : props.mirrored
            : undefined,
        is_knockout: props.knockout,
        pcb_component_id: (this.parent?.pcb_component_id ??
          container?.pcb_component_id ??
          undefined)!,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })
      this.pcb_copper_text_id = pcb_copper_text.pcb_copper_text_id
      this.pcb_copper_text_ids.push(pcb_copper_text.pcb_copper_text_id)
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

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const idsToMove =
      this.pcb_copper_text_ids.length > 0
        ? this.pcb_copper_text_ids
        : this.pcb_copper_text_id
          ? [this.pcb_copper_text_id]
          : []

    for (const id of idsToMove) {
      const text = db.pcb_copper_text.get(id)
      if (text) {
        db.pcb_copper_text.update(id, {
          anchor_position: {
            x: text.anchor_position.x + deltaX,
            y: text.anchor_position.y + deltaY,
          },
        })
      }
    }
  }
}
