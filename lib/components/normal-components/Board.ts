import { boardProps } from "@tscircuit/props"
import type { z } from "zod"
import { NormalComponent } from "../base-components/NormalComponent"

export class Board extends NormalComponent<typeof boardProps> {
  pcb_board_id: string | null = null

  canHaveChildren = true

  get config() {
    return {
      zodProps: boardProps,
    }
  }

  doInitialPcbComponentRender(): void {
    const { db } = this.project!
    const { _parsedProps: props } = this

    const pcb_board = db.pcb_board.insert({
      center: { x: props.pcbX, y: props.pcbY },
      width: props.width,
      height: props.height,
    })

    this.pcb_board_id = pcb_board.pcb_board_id

    this.runRenderPhaseForChildren("PcbComponentRender")
  }

  removePcbComponentRender(): void {
    const { db } = this.project!
    if (!this.pcb_board_id) return
    db.pcb_board.delete(this.pcb_board_id!)
    this.pcb_board_id = null
  }
}
