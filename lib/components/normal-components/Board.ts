// lib>components>normal-components>Board.ts
import { boardProps } from "@tscircuit/props"
import type { z } from "zod"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { identity, type Matrix } from "transformation-matrix"
import { Group } from "../primitive-components/Group/Group"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
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

  doInitialBoardAutoSize(): void {
    if (this.root?.pcbDisabled) return
    
    // Skip auto-size if dimensions already specified
    if ((this._parsedProps.width && this._parsedProps.height) || this._parsedProps.outline) {
      // console.log("Skipping auto-size - dimensions specified", this._parsedProps)
      console.log("Skipping auto-size because dimensions are specified")
      return
    }

    const bounds = getBoundsOfPcbComponents(this.children)
    
    if (bounds.width === 0 || bounds.height === 0) {
      console.log("No valid components found for auto-sizing")
      return
    }

    const padding = 2
    this._parsedProps.width = bounds.width + (padding * 2)
    this._parsedProps.height = bounds.height + (padding * 2)
    
    // Set board center based on component bounds
    this._parsedProps.pcbX = (bounds.minX + bounds.maxX) / 2
    this._parsedProps.pcbY = (bounds.minY + bounds.maxY) / 2
    
    // console.log("Auto-sized dimensions:", bounds.width, bounds.height)
    // console.log("Center position:", this._parsedProps.pcbX, this._parsedProps.pcbY)
  }

  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const pcb_board = db.pcb_board.insert({
      center: {
        x: props.pcbX ?? 0,  // Use calculated center
        y: props.pcbY ?? 0
      },
      thickness: this.boardThickness,
      num_layers: this.allLayers.length,
      width: props.width!,
      height: props.height!,
      outline: props.outline
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
