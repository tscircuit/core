import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import { copperTextProps } from "@tscircuit/props"

export class CopperText extends PrimitiveComponent<typeof copperTextProps> {
  isPcbPrimitive = true

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
    const container = this.getPrimitiveContainer()!
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()

    db.pcb_copper_text.insert({
      anchor_alignment: props.anchorAlignment,
      anchor_position: {
        x: position.x,
        y: position.y,
      },
      font: "tscircuit2024",
      font_size: props.fontSize!,
      layer: props.layer ?? "top",
      text: normalizeTextForCircuitJson(props.text),
      ccw_rotation: props.pcbRotation,
      is_mirrored: props.mirrored,
      is_knockout: props.knockout,
      pcb_component_id: container.pcb_component_id!,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })
  }
}
