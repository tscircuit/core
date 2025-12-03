import type { SourceBoard, PcbBoard } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { Board } from "lib/components/normal-components/Board"

export function inflateSourceBoard(
  sourceBoard: SourceBoard,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  // Don't inflate a board if the subcircuit is already a Board component with circuitJson
  // This happens when you have: <board circuitJson={...} />
  // In this case, the Board itself is the board, and we don't need to create a nested board
  if (subcircuit instanceof Board) {
    return
  }

  // Don't inflate a board if the subcircuit is already inside a Board component
  // This happens when you have: <board><subcircuit circuitJson={...} /></board>
  if ((subcircuit as any).parent instanceof Board) {
    return
  }

  // Get the PCB board element - typically there's only one per circuit
  // We get the first pcb_board since there's no direct link from source_board
  const pcbBoards = injectionDb.pcb_board.list()
  const pcbBoard = pcbBoards.length > 0 ? (pcbBoards[0] as PcbBoard) : null

  // Create board props from source and PCB data
  const boardProps: any = {
    name: sourceBoard.title || "inflated_board",
  }

  // Add PCB-specific properties if available
  if (pcbBoard) {
    if (pcbBoard.width) boardProps.width = pcbBoard.width
    if (pcbBoard.height) boardProps.height = pcbBoard.height
    if (pcbBoard.center) {
      boardProps.pcbX = pcbBoard.center.x
      boardProps.pcbY = pcbBoard.center.y
    }
    if (pcbBoard.outline) boardProps.outline = pcbBoard.outline
    if (pcbBoard.thickness) boardProps.thickness = pcbBoard.thickness
    if (pcbBoard.num_layers) boardProps.layers = pcbBoard.num_layers
    if (pcbBoard.material) boardProps.material = pcbBoard.material
  }

  // Create the Board instance
  const board = new Board(boardProps)

  // Set the source_board_id so it can be referenced
  board.source_board_id = sourceBoard.source_board_id

  // Add the board to its parent group if it has one, otherwise add to subcircuit
  if (
    sourceBoard.source_group_id &&
    groupsMap?.has(sourceBoard.source_group_id)
  ) {
    const parentGroup = groupsMap.get(sourceBoard.source_group_id)!
    parentGroup.add(board)
  } else {
    subcircuit.add(board)
  }

  return board
}
