import { boardProps } from "@tscircuit/props"
import type { z } from "zod"
import { NormalComponent } from "../base-components/NormalComponent"
import { identity, type Matrix } from "transformation-matrix"
import { Group } from "../primitive-components/Group"

export class Board extends Group<typeof boardProps> {
  pcb_board_id: string | null = null

  get isSubcircuit() {
    return true
  }

  get config() {
    return {
      zodProps: boardProps,
    }
  }

  get boardThickness() {
    const { _parsedProps: props } = this
    return 1.4 // TODO use prop
  }

  /**
   * Get all available layers for the board
   */
  get allLayers() {
    // TODO use the board numLayers prop
    return ["top", "bottom", "inner1", "inner2"]
  }

  doInitialPcbComponentRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    if (!props.width || !props.height) {
      throw new Error("Board width and height or an outline are required")
    }

    const pcb_board = db.pcb_board.insert({
      center: { x: props.pcbX, y: props.pcbY },

      thickness: this.boardThickness,
      num_layers: this.allLayers.length,

      width: props.width,
      height: props.height,
      outline: props.outline,
    })

    this.pcb_board_id = pcb_board.pcb_board_id!
  }

  removePcbComponentRender(): void {
    const { db } = this.root!
    if (!this.pcb_board_id) return
    db.pcb_board.delete(this.pcb_board_id!)
    this.pcb_board_id = null
  }

  _computePcbGlobalTransformBeforeLayout(): Matrix {
    return identity()
  }
}
