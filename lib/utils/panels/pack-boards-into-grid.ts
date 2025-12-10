import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { distance } from "circuit-json"
import type { Board } from "lib/components/normal-components/Board"

interface PackingOptions {
  row?: number
  col?: number
  cellWidth?: string | number
  cellHeight?: string | number
  boardGap: number
}

interface BoardWithDims {
  board: Board
  width: number
  height: number
}

export const packBoardsIntoGrid = ({
  boards,
  db,
  row,
  col,
  cellWidth,
  cellHeight,
  boardGap,
}: { boards: Board[]; db: CircuitJsonUtilObjects } & PackingOptions): {
  positions: Array<{ board: Board; pos: { x: number; y: number } }>
  gridWidth: number
  gridHeight: number
} => {
  const boardsWithDims: BoardWithDims[] = boards
    .map((board) => {
      const pcbBoard = db.pcb_board.get(board.pcb_board_id!)
      if (
        !pcbBoard ||
        pcbBoard.width === undefined ||
        pcbBoard.height === undefined
      ) {
        return null
      }
      return { board, width: pcbBoard.width, height: pcbBoard.height }
    })
    .filter((b): b is BoardWithDims => b !== null)

  if (boardsWithDims.length === 0) {
    return {
      positions: [],
      gridWidth: 0,
      gridHeight: 0,
    }
  }

  const explicitRow = row
  const explicitCol = col

  const cols =
    explicitCol ??
    (explicitRow
      ? Math.ceil(boardsWithDims.length / explicitRow)
      : Math.ceil(Math.sqrt(boardsWithDims.length)))
  const rows = explicitRow ?? Math.ceil(boardsWithDims.length / cols)

  // Initialize column widths and row heights to 0
  const colWidths = Array(cols).fill(0)
  const rowHeights = Array(rows).fill(0)

  // Determine the max width for each column and max height for each row
  boardsWithDims.forEach((b, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    if (row < rowHeights.length && b.height > rowHeights[row]) {
      rowHeights[row] = b.height
    }
    if (col < colWidths.length && b.width > colWidths[col]) {
      colWidths[col] = b.width
    }
  })

  // Apply cellWidth and cellHeight as minimums
  const minCellWidth = cellWidth ? distance.parse(cellWidth) : 0
  const minCellHeight = cellHeight ? distance.parse(cellHeight) : 0

  for (let i = 0; i < colWidths.length; i++) {
    colWidths[i] = Math.max(colWidths[i], minCellWidth)
  }
  for (let i = 0; i < rowHeights.length; i++) {
    rowHeights[i] = Math.max(rowHeights[i], minCellHeight)
  }

  const totalGridWidth =
    colWidths.reduce((a, b) => a + b, 0) +
    (cols > 1 ? (cols - 1) * boardGap : 0)
  const totalGridHeight =
    rowHeights.reduce((a, b) => a + b, 0) +
    (rows > 1 ? (rows - 1) * boardGap : 0)

  const startX = -totalGridWidth / 2
  const startY = -totalGridHeight / 2

  const rowYOffsets = [startY]
  for (let i = 1; i < rows; i++) {
    rowYOffsets.push(rowYOffsets[i - 1] + rowHeights[i - 1] + boardGap)
  }

  const colXOffsets = [startX]
  for (let i = 1; i < cols; i++) {
    colXOffsets.push(colXOffsets[i - 1] + colWidths[i - 1] + boardGap)
  }

  const positions: Array<{ board: Board; pos: { x: number; y: number } }> = []

  boardsWithDims.forEach((b, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)

    if (row >= rowYOffsets.length || col >= colXOffsets.length) return

    const cellX = colXOffsets[col]
    const cellY = rowYOffsets[row]

    const cellWidth = colWidths[col]
    const cellHeight = rowHeights[row]

    // Center the board within its dynamic cell
    const boardX = cellX + cellWidth / 2
    const boardY = cellY + cellHeight / 2

    positions.push({
      board: b.board,
      pos: { x: boardX, y: boardY },
    })
  })

  return { positions, gridWidth: totalGridWidth, gridHeight: totalGridHeight }
}
