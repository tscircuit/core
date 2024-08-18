import { boardProps } from "@tscircuit/props"
import type { z } from "zod"
import { BaseComponent, type BaseComponentConfig } from "./BaseComponent"

export class Board extends BaseComponent<typeof boardProps> {
  pcb_board_id: string | null = null

  canHaveChildren = true

  get config() {
    return {
      zodProps: boardProps,
    }
  }

  doInitialPcbComponentRender(): void {
    const { db } = this.project!

    const pcb_board = db.pcb_board.insert({
      center: { x: this.props.pcbX, y: this.props.pcbY },
      width: this.props.width,
      height: this.props.height,
    })

    this.pcb_board_id = pcb_board.pcb_board_id

    this.doChildrenPcbComponentRender()
  }

  removePcbComponentRender(): void {
    const { db } = this.project!
    if (!this.pcb_board_id) return
    db.pcb_board.delete(this.pcb_board_id!)
    this.pcb_board_id = null
  }
}
