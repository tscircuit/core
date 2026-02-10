import type { PcbBoard } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { Board } from "lib/components/normal-components/Board"
import type { BoardProps } from "@tscircuit/props"

export function inflatePcbBoard(
  pcbBoard: PcbBoard,
  inflatorContext: InflatorContext,
) {
  const { subcircuit } = inflatorContext

  // Don't inflate a board if the subcircuit is already a Board component with circuitJson
  // This happens when you have: <board circuitJson={...} />
  // In this case, the Board itself is the board, and we don't need to create a nested board
  if ((subcircuit as any).lowercaseComponentName === "board") {
    return
  }
  // Don't inflate a board if the subcircuit is already inside a Board component
  // This happens when you have: <board><subcircuit circuitJson={...} /></board>
  // But allow mountedboard components to have their own boards inflated
  if (
    (subcircuit as any).parent?.lowercaseComponentName === "board" &&
    (subcircuit as any).lowercaseComponentName !== "mountedboard"
  ) {
    return
  }

  // Create board props from PCB data
  const boardProps: BoardProps = {
    name: "inflated_board",
  }

  // Add PCB-specific properties
  if (pcbBoard.width) boardProps.width = pcbBoard.width
  if (pcbBoard.height) boardProps.height = pcbBoard.height
  if (pcbBoard.center) {
    boardProps.pcbX = pcbBoard.center.x
    boardProps.pcbY = pcbBoard.center.y
  }
  if (pcbBoard.outline) boardProps.outline = pcbBoard.outline
  if (pcbBoard.thickness) boardProps.thickness = pcbBoard.thickness
  if (pcbBoard.material) boardProps.material = pcbBoard.material

  // Create the Board instance
  const board = new Board(boardProps)

  // Set the pcb_board_id so it can be referenced
  board.pcb_board_id = pcbBoard.pcb_board_id

  // Add the board to the subcircuit
  subcircuit.add(board)

  return board
}
