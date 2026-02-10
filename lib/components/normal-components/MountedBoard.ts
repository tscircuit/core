import { mountedboardProps } from "@tscircuit/props"
import { Subcircuit } from "../primitive-components/Group/Subcircuit/Subcircuit"
import type { z } from "zod"
import type { PcbBoard } from "circuit-json"
import { Board } from "./Board"

export class MountedBoard extends Subcircuit {
  pcb_board_id: string | null = null

  constructor(props: z.input<typeof mountedboardProps>) {
    super(props)
  }

  get config() {
    return {
      componentName: "MountedBoard",
      zodProps: mountedboardProps,
    }
  }

  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalPcbPositionBeforeLayout()

    const pcb_board = db.pcb_board.insert({
      center: { x: globalPos.x, y: globalPos.y },
      width: props.width ?? 0,
      height: props.height ?? 0,
      is_mounted_to_carrier_board: true,
    } as Omit<PcbBoard, "type" | "pcb_board_id">)

    this.pcb_board_id = pcb_board.pcb_board_id
  }

  doInitialPcbBoardAutoSize(): void {
    if (!this.pcb_board_id || !this.root) return

    const carrierBoardId = this._findCarrierBoardId()
    if (carrierBoardId) {
      this.root.db.pcb_board.update(this.pcb_board_id, {
        carrier_pcb_board_id: carrierBoardId,
      } as Partial<PcbBoard>)
    }
  }

  private _findCarrierBoardId(): string | null {
    let current = this.parent
    while (current) {
      if (current instanceof Board) {
        return current.pcb_board_id
      }
      current = current.parent
    }
    return null
  }
}
