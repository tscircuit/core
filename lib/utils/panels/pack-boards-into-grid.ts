import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
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

export const getBoardDimensionsFromProps = (
  board: Board,
): { width: number; height: number } => {
  const props = board._parsedProps

  // Check for explicit width/height
  let width = props.width != null ? distance.parse(props.width) : undefined
  let height = props.height != null ? distance.parse(props.height) : undefined

  // Check for outline
  if ((width === undefined || height === undefined) && props.outline?.length) {
    const outlineBounds = getBoundsFromPoints(props.outline)
    if (outlineBounds) {
      width ??= outlineBounds.maxX - outlineBounds.minX
      height ??= outlineBounds.maxY - outlineBounds.minY
    }
  }

  // Check for circuitJson that contains pcb_board
  if (
    (width === undefined || height === undefined) &&
    props.circuitJson?.length
  ) {
    const pcbBoardFromJson = props.circuitJson.find(
      (elm: any) => elm.type === "pcb_board",
    )
    if (pcbBoardFromJson) {
      width ??= pcbBoardFromJson.width
      height ??= pcbBoardFromJson.height
    }
  }

  return {
    width: width ?? 0,
    height: height ?? 0,
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
