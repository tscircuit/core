import { mountedboardProps } from "@tscircuit/props"
import { Subcircuit } from "../primitive-components/Group/Subcircuit/Subcircuit"
import type { BoardI } from "./BoardI"
import type { PcbBoard } from "circuit-json"
import { Board } from "./Board"

export class MountedBoard extends Subcircuit implements BoardI {
  pcb_board_id: string | null = null

  get config() {
    return {
      componentName: "MountedBoard",
      zodProps: mountedboardProps,
    }
  }

  get boardThickness() {
    return 1.4
  }

  get allLayers() {
    return ["top", "bottom"] as const
  }

  _connectedSchematicPortPairs = new Set<string>()

  /**
   * Returns the carrier board's calc variables so that calc(board.*)
   * expressions in pcbX/pcbY resolve against the parent board.
   */
  _getBoardCalcVariables(): Record<string, number> {
    const carrierBoard = this._findCarrierBoard()
    return carrierBoard?._getBoardCalcVariables() ?? {}
  }

  private _findCarrierBoard(): Board | null {
    let current = this.parent
    while (current) {
      if (current instanceof Board) {
        return current
      }
      current = current.parent
    }
    return null
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

    const carrierBoard = this._findCarrierBoard()
    if (carrierBoard?.pcb_board_id) {
      this.root.db.pcb_board.update(this.pcb_board_id, {
        carrier_pcb_board_id: carrierBoard.pcb_board_id,
      } as Partial<PcbBoard>)
    }
  }
}
