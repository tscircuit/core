import { boardProps } from "@tscircuit/props"
import type { z } from "zod"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { identity, type Matrix } from "transformation-matrix"
import { Group } from "../primitive-components/Group/Group"

export class Board extends Group<typeof boardProps> {
  pcb_board_id: string | null = null

  get isSubcircuit() {
    return true
  }

  get config() {
    return {
      componentName: "Board",
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
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    // If outline is not provided, width and height must be specified
    if (!props.outline && (!props.width || !props.height)) {
      throw new Error("Board width and height or an outline are required")
    }

    // Compute width and height from outline if not provided
    let computedWidth = props.width
    let computedHeight = props.height
    if (props.outline) {
      const xValues = props.outline.map((point) => point.x)
      const yValues = props.outline.map((point) => point.y)

      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const minY = Math.min(...yValues)
      const maxY = Math.max(...yValues)

      computedWidth = maxX - minX
      computedHeight = maxY - minY
    }

    const pcb_board = db.pcb_board.insert({
      center: {
        x: (props.pcbX ?? 0) + (props.outlineOffsetX ?? 0),
        y: (props.pcbY ?? 0) + (props.outlineOffsetY ?? 0),
      },

      thickness: this.boardThickness,
      num_layers: this.allLayers.length,

      width: computedWidth!,
      height: computedHeight!,
      outline: props.outline?.map((point) => ({
        x: point.x + (props.outlineOffsetX ?? 0),
        y: point.y + (props.outlineOffsetY ?? 0),
      })),
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
