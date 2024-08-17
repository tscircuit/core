import { boardProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"

export class Board extends BaseComponent<typeof boardProps> {
  pcb_board_id: string | null = null
  propsZod = boardProps

  doInitialPcbComponentRender(): void {
    const { db } = this.project!

    const pcb_board = db.pcb_board.insert({
      center: { x: this.props.pcbX, y: this.props.pcbY },
      width: this.props.width,
      height: this.props.height,
    })

    this.doChildrenPcbComponentRender()
  }

  updatePcbComponentRender(): void {
    const { db } = this.project!
    // TODO
  }

  removePcbComponentRender(): void {
    const { db } = this.project!
    if (!this.pcb_board_id) return
    db.pcb_board.delete(this.pcb_board_id!)
    this.pcb_board_id = null
  }
}
