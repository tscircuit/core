import { pcbStiffenerProps } from "@tscircuit/props"
import type { PcbStiffener as PcbStiffenerRecord } from "circuit-json"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { getPcbFlexBoardTransform } from "./getPcbFlexBoardTransform"

export class PcbStiffener extends PrimitiveComponent<typeof pcbStiffenerProps> {
  pcb_stiffener_id: PcbStiffenerRecord["pcb_stiffener_id"] | null = null

  get config() {
    return { componentName: "PcbStiffener", zodProps: pcbStiffenerProps }
  }

  doInitialPcbFlexRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps
    const { board, transform } = getPcbFlexBoardTransform(this)
    const base = {
      pcb_board_id: board.pcb_board_id,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
      name: props.name,
      layer: props.layer,
      material: props.material,
      thickness: props.thickness,
      adhesive_thickness: props.adhesiveThickness,
    }
    const geometry =
      props.shape === "rect"
        ? {
            shape: "rect" as const,
            center: applyToPoint(transform, { x: 0, y: 0 }),
            rotation: (decomposeTSR(transform).rotation.angle * 180) / Math.PI,
            width: props.width,
            height: props.height,
          }
        : {
            shape: "polygon" as const,
            outline: props.outline.map((point) =>
              applyToPoint(transform, point),
            ),
          }
    this.pcb_stiffener_id = db.pcb_stiffener.insert({
      ...base,
      ...geometry,
    }).pcb_stiffener_id
  }

  doRemovePcbFlexRender(): void {
    if (!this.pcb_stiffener_id) return
    this.root!.db.pcb_stiffener.delete(this.pcb_stiffener_id)
    this.pcb_stiffener_id = null
  }
}
