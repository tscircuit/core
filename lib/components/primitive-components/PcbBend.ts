import { pcbBendProps } from "@tscircuit/props"
import type { PcbBend as PcbBendRecord } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { getPcbFlexBoardTransform } from "./getPcbFlexBoardTransform"

export class PcbBend extends PrimitiveComponent<typeof pcbBendProps> {
  pcb_bend_id: PcbBendRecord["pcb_bend_id"] | null = null

  get config() {
    return { componentName: "PcbBend", zodProps: pcbBendProps }
  }

  // Resolve board-relative geometry after board autosizing and panel placement.
  doInitialPcbFlexRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps
    const { board, transform } = getPcbFlexBoardTransform(this)
    this.pcb_bend_id = db.pcb_bend.insert({
      pcb_board_id: board.pcb_board_id,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
      name: props.name,
      start: applyToPoint(transform, { x: props.x1, y: props.y1 }),
      end: applyToPoint(transform, { x: props.x2, y: props.y2 }),
      bend_angle: props.bendAngle,
      bend_radius: props.bendRadius,
      bend_side: props.bendSide,
    }).pcb_bend_id
  }

  doRemovePcbFlexRender(): void {
    if (!this.pcb_bend_id) return
    this.root!.db.pcb_bend.delete(this.pcb_bend_id)
    this.pcb_bend_id = null
  }
}
