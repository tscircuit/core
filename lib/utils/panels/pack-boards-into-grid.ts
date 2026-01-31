import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { distance } from "circuit-json"
import type { Board } from "lib/components/normal-components/Board"
import { getBoardDimensionsFromProps } from "./get-board-dimensions-from-props"

interface PackingOptions {
  row?: number
  col?: number
  cellWidth?: string | number
  cellHeight?: string | number
  boardGap: number
  availablePanelWidth?: number
  availablePanelHeight?: number
}

interface BoardWithDims {
  board: Board
  width: number
  height: number
}

/**
 * Calculate optimal grid rows and cols that fit within available panel dimensions.
 * The goal is to find a grid configuration where boards don't exceed panel boundaries.
 */
function calculateOptimalGrid({
  boardsWithDims,
  availableWidth,
  availableHeight,
  boardGap,
  minCellWidth,
  minCellHeight,
}: {
  boardsWithDims: BoardWithDims[]
  availableWidth: number
  availableHeight: number
  boardGap: number
  minCellWidth: number
  minCellHeight: number
}): { rows: number; cols: number } {
  const boardCount = boardsWithDims.length

  if (boardCount === 0) {
    return { rows: 0, cols: 0 }
  }

  const maxBoardWidth = Math.max(
    ...boardsWithDims.map((b) => b.width),
    minCellWidth,
  )
  const maxBoardHeight = Math.max(
    ...boardsWithDims.map((b) => b.height),
    minCellHeight,
  )

  const maxCols = Math.max(
    1,
    Math.floor((availableWidth + boardGap) / (maxBoardWidth + boardGap)),
  )
  const maxRows = Math.max(
    1,
    Math.floor((availableHeight + boardGap) / (maxBoardHeight + boardGap)),
  )

  let bestCols = maxCols
  let bestRows = Math.ceil(boardCount / bestCols)

  if (bestRows > maxRows) {
    bestRows = maxRows
    bestCols = Math.ceil(boardCount / bestRows)

    if (bestCols > maxCols) {
      bestCols = maxCols
      bestRows = Math.ceil(boardCount / bestCols)
    }
  }

  return {
    rows: Math.max(1, bestRows),
    cols: Math.max(1, bestCols),
  }
}

export const packBoardsIntoGrid = ({
  boards,
  db,
  row,
  col,
  cellWidth,
  cellHeight,
  boardGap,
  availablePanelWidth,
  availablePanelHeight,
}: { boards: Board[]; db?: CircuitJsonUtilObjects } & PackingOptions): {
  positions: Array<{ board: Board; pos: { x: number; y: number } }>
  gridWidth: number
  gridHeight: number
} => {
  const boardsWithDims: BoardWithDims[] = boards
    .map((board) => {
      let width: number | undefined
      let height: number | undefined

      // Try to get dimensions from database if available
      if (db && board.pcb_board_id) {
        const pcbBoard = db.pcb_board.get(board.pcb_board_id)
        if (pcbBoard?.width !== undefined && pcbBoard?.height !== undefined) {
          width = pcbBoard.width
          height = pcbBoard.height
        }
      }

      // Fall back to props-based dimensions
      if (width === undefined || height === undefined) {
        const propsDims = getBoardDimensionsFromProps(board)
        width = propsDims.width
        height = propsDims.height
      }

      // Skip boards with unknown dimensions
      if (width === 0 && height === 0) {
        return null
      }

      return { board, width, height }
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

  let cols: number
  let rows: number

  if (explicitCol !== undefined) {
    cols = explicitCol
    rows = explicitRow ?? Math.ceil(boardsWithDims.length / cols)
  } else if (explicitRow !== undefined) {
    rows = explicitRow
    cols = Math.ceil(boardsWithDims.length / rows)
  } else if (
    availablePanelWidth !== undefined &&
    availablePanelHeight !== undefined
  ) {
    const result = calculateOptimalGrid({
      boardsWithDims,
      availableWidth: availablePanelWidth,
      availableHeight: availablePanelHeight,
      boardGap,
      minCellWidth: cellWidth ? distance.parse(cellWidth) : 0,
      minCellHeight: cellHeight ? distance.parse(cellHeight) : 0,
    })
    cols = result.cols
    rows = result.rows
  } else {
    cols = Math.ceil(Math.sqrt(boardsWithDims.length))
    rows = Math.ceil(boardsWithDims.length / cols)
  }

  // Initialize column widths and row heights to 0
  const colWidths = Array(cols).fill(0)
  const rowHeights = Array(rows).fill(0)

  // Determine the max width for each column and max height for each row
  boardsWithDims.forEach((b, i) => {
    const colIdx = i % cols
    const rowIdx = Math.floor(i / cols)
    if (rowIdx < rowHeights.length && b.height > rowHeights[rowIdx]) {
      rowHeights[rowIdx] = b.height
    }
    if (colIdx < colWidths.length && b.width > colWidths[colIdx]) {
      colWidths[colIdx] = b.width
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
    const colIdx = i % cols
    const rowIdx = Math.floor(i / cols)

    if (rowIdx >= rowYOffsets.length || colIdx >= colXOffsets.length) return

    const cellX = colXOffsets[colIdx]
    const cellY = rowYOffsets[rowIdx]

    const currentCellWidth = colWidths[colIdx]
    const currentCellHeight = rowHeights[rowIdx]

    // Center the board within its dynamic cell
    const boardX = cellX + currentCellWidth / 2
    const boardY = cellY + currentCellHeight / 2

    positions.push({
      board: b.board,
      pos: { x: boardX, y: boardY },
    })
  })

  return { positions, gridWidth: totalGridWidth, gridHeight: totalGridHeight }
}
