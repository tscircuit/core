import { pcbBendProps } from "@tscircuit/props"
import type { PcbBend as PcbBendRecord, PcbCutoutCircle } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { getPcbFlexBoardTransform } from "./getPcbFlexBoardTransform"

export class PcbBend extends PrimitiveComponent<typeof pcbBendProps> {
  pcb_bend_id: PcbBendRecord["pcb_bend_id"] | null = null
  private tearReliefCutoutIds: PcbCutoutCircle["pcb_cutout_id"][] = []

  get config() {
    return { componentName: "PcbBend", zodProps: pcbBendProps }
  }

  // Resolve board-relative geometry after board autosizing and panel placement.
  doInitialPcbFlexRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps
    const { board, transform } = getPcbFlexBoardTransform(this)
    const bend = db.pcb_bend.insert({
      pcb_board_id: board.pcb_board_id,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
      name: props.name,
      start: applyToPoint(transform, { x: props.x1, y: props.y1 }),
      end: applyToPoint(transform, { x: props.x2, y: props.y2 }),
      bend_angle: props.bendAngle,
      bend_radius: props.bendRadius,
      bend_side: props.bendSide,
    })
    this.pcb_bend_id = bend.pcb_bend_id

    if (props.tearReliefRadius !== undefined) {
      // pcb_cutout centers are circuit-world points in mm (+X right, +Y top,
      // +Z above, right-handed). Bend endpoints are board-center-relative, so
      // restore the board translation. Standard cutouts feed routing obstacles,
      // board-mesh subtraction, and fabrication outline clipping.
      for (const endpoint of [bend.start, bend.end]) {
        const cutout = db.pcb_cutout.insert({
          shape: "circle",
          center: {
            x: endpoint.x + board.center.x,
            y: endpoint.y + board.center.y,
          },
          radius: props.tearReliefRadius,
          pcb_board_id: board.pcb_board_id,
          pcb_group_id: bend.pcb_group_id,
          subcircuit_id: bend.subcircuit_id,
        })
        this.tearReliefCutoutIds.push(cutout.pcb_cutout_id)
      }
    }
  }

  removePcbFlexRender(): void {
    for (const cutoutId of this.tearReliefCutoutIds) {
      this.root!.db.pcb_cutout.delete(cutoutId)
    }
    this.tearReliefCutoutIds = []
    if (!this.pcb_bend_id) return
    this.root!.db.pcb_bend.delete(this.pcb_bend_id)
    this.pcb_bend_id = null
  }
}
