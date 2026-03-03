import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { distance } from "circuit-json"
import type { Board } from "lib/components/normal-components/Board"
import type { Subpanel } from "lib/components/normal-components/Subpanel"
import { getBoardDimensionsFromProps } from "./get-board-dimensions-from-props"

export type LayoutableItem = Board | Subpanel

export interface GridPackingOptions {
  row?: number
  col?: number
  cellWidth?: string | number
  cellHeight?: string | number
  boardGap: number
  availablePanelWidth?: number
  availablePanelHeight?: number
}

/**
 * Pack an array of layoutable items (Boards or Subpanels) into a grid.
 * Returns positions for each item relative to the grid center.
 */
export function packIntoGrid({
  items,
  db,
  row,
  col,
  cellWidth,
  cellHeight,
  boardGap,
  availablePanelWidth,
  availablePanelHeight,
}: {
  items: LayoutableItem[]
  db?: CircuitJsonUtilObjects
} & GridPackingOptions): {
  positions: Array<{ item: LayoutableItem; pos: { x: number; y: number } }>
  gridWidth: number
  gridHeight: number
} {
  // Get dimensions for each item
  const itemsWithDims = items
    .map((item) => {
      const dims = getItemDimensions(item, db)
      return { item, width: dims.width, height: dims.height }
    })
    .filter((item) => !(item.width === 0 && item.height === 0))

  if (itemsWithDims.length === 0) {
    return { positions: [], gridWidth: 0, gridHeight: 0 }
  }

  // Determine grid dimensions
  let cols: number
  let rows: number
  const minCellWidth = cellWidth ? distance.parse(cellWidth) : 0
  const minCellHeight = cellHeight ? distance.parse(cellHeight) : 0

  if (col !== undefined) {
    cols = col
    rows = row ?? Math.ceil(itemsWithDims.length / cols)
  } else if (row !== undefined) {
    rows = row
    cols = Math.ceil(itemsWithDims.length / rows)
  } else if (
    availablePanelWidth !== undefined &&
    availablePanelHeight !== undefined
  ) {
    // Calculate optimal grid to fit within available space
    const maxItemWidth = Math.max(
      ...itemsWithDims.map((b) => b.width),
      minCellWidth,
    )
    const maxItemHeight = Math.max(
      ...itemsWithDims.map((b) => b.height),
      minCellHeight,
    )

    const maxCols = Math.max(
      1,
      Math.floor((availablePanelWidth + boardGap) / (maxItemWidth + boardGap)),
    )
    const maxRows = Math.max(
      1,
      Math.floor(
        (availablePanelHeight + boardGap) / (maxItemHeight + boardGap),
      ),
    )

    cols = maxCols
    rows = Math.ceil(itemsWithDims.length / cols)

    if (rows > maxRows) {
      rows = maxRows
      cols = Math.ceil(itemsWithDims.length / rows)
      if (cols > maxCols) {
        cols = maxCols
        rows = Math.ceil(itemsWithDims.length / cols)
      }
    }

    cols = Math.max(1, cols)
    rows = Math.max(1, rows)
  } else {
    cols = Math.ceil(Math.sqrt(itemsWithDims.length))
    rows = Math.ceil(itemsWithDims.length / cols)
  }

  // Calculate column widths and row heights
  const colWidths = Array(cols).fill(0)
  const rowHeights = Array(rows).fill(0)

  itemsWithDims.forEach((item, i) => {
    const colIdx = i % cols
    const rowIdx = Math.floor(i / cols)
    if (rowIdx < rowHeights.length && item.height > rowHeights[rowIdx]) {
      rowHeights[rowIdx] = item.height
    }
    if (colIdx < colWidths.length && item.width > colWidths[colIdx]) {
      colWidths[colIdx] = item.width
    }
  })

  // Apply minimum cell dimensions
  for (let i = 0; i < colWidths.length; i++) {
    colWidths[i] = Math.max(colWidths[i], minCellWidth)
  }
  for (let i = 0; i < rowHeights.length; i++) {
    rowHeights[i] = Math.max(rowHeights[i], minCellHeight)
  }

  // Calculate total grid size
  const gridWidth =
    colWidths.reduce((a, b) => a + b, 0) +
    (cols > 1 ? (cols - 1) * boardGap : 0)
  const gridHeight =
    rowHeights.reduce((a, b) => a + b, 0) +
    (rows > 1 ? (rows - 1) * boardGap : 0)

  // Calculate offsets (grid centered at origin)
  const startX = -gridWidth / 2
  const startY = -gridHeight / 2

  const colXOffsets = [startX]
  for (let i = 1; i < cols; i++) {
    colXOffsets.push(colXOffsets[i - 1] + colWidths[i - 1] + boardGap)
  }

  const rowYOffsets = [startY]
  for (let i = 1; i < rows; i++) {
    rowYOffsets.push(rowYOffsets[i - 1] + rowHeights[i - 1] + boardGap)
  }

  // Calculate positions for each item
  const positions: Array<{
    item: LayoutableItem
    pos: { x: number; y: number }
  }> = []

  itemsWithDims.forEach((itemWithDims, i) => {
    const colIdx = i % cols
    const rowIdx = Math.floor(i / cols)

    if (rowIdx >= rowYOffsets.length || colIdx >= colXOffsets.length) return

    // Center item within its cell
    const x = colXOffsets[colIdx] + colWidths[colIdx] / 2
    const y = rowYOffsets[rowIdx] + rowHeights[rowIdx] / 2

    positions.push({ item: itemWithDims.item, pos: { x, y } })
  })

  return { positions, gridWidth, gridHeight }
}

/**
 * Get dimensions of a Board or Subpanel
 */
function getItemDimensions(
  item: LayoutableItem,
  db?: CircuitJsonUtilObjects,
): { width: number; height: number } {
  if (item.componentName === "Board") {
    const board = item as Board
    if (db && board.pcb_board_id) {
      const pcbBoard = db.pcb_board.get(board.pcb_board_id)
      if (pcbBoard?.width !== undefined && pcbBoard?.height !== undefined) {
        return { width: pcbBoard.width, height: pcbBoard.height }
      }
    }
    return getBoardDimensionsFromProps(board)
  }

  if (item.componentName === "Subpanel") {
    const subpanel = item as Subpanel
    const props = subpanel._parsedProps

    if (props.width !== undefined && props.height !== undefined) {
      return {
        width: distance.parse(props.width),
        height: distance.parse(props.height),
      }
    }

    const directBoards = subpanel._getDirectBoardChildren()

    if (directBoards.length === 0) {
      const allBoards = subpanel._getAllBoardInstances()
      if (allBoards.length === 0) return { width: 0, height: 0 }

      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      for (const board of allBoards) {
        const dims = getBoardDimensionsFromProps(board)
        if (dims.width === 0 || dims.height === 0) continue
        const offset = board._panelPositionOffset ?? { x: 0, y: 0 }
        minX = Math.min(minX, offset.x - dims.width / 2)
        maxX = Math.max(maxX, offset.x + dims.width / 2)
        minY = Math.min(minY, offset.y - dims.height / 2)
        maxY = Math.max(maxY, offset.y + dims.height / 2)
      }

      if (minX === Infinity) return { width: 0, height: 0 }
      return { width: maxX - minX, height: maxY - minY }
    }

    if (directBoards.length === 1) {
      return getBoardDimensionsFromProps(directBoards[0])
    }

    if (subpanel._cachedGridWidth > 0 && subpanel._cachedGridHeight > 0) {
      const edgePadding = distance.parse(props.edgePadding ?? 5)
      return {
        width: subpanel._cachedGridWidth + edgePadding * 2,
        height: subpanel._cachedGridHeight + edgePadding * 2,
      }
    }

    let totalWidth = 0
    let totalHeight = 0
    for (const board of directBoards) {
      const dims = getBoardDimensionsFromProps(board)
      totalWidth = Math.max(totalWidth, dims.width)
      totalHeight = Math.max(totalHeight, dims.height)
    }
    return { width: totalWidth, height: totalHeight }
  }

  return { width: 0, height: 0 }
}
