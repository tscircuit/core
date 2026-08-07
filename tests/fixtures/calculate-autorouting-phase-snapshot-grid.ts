export interface AutoroutingPhaseSnapshotGrid {
  columnCount: number
  rowCount: number
}

/**
 * Chooses an aspect-aware rectangular grid while keeping each START/END pair
 * together in adjacent horizontal cells.
 */
export function calculateAutoroutingPhaseSnapshotGrid({
  panelCount,
  panelWidth,
  panelHeight,
  gap,
}: {
  panelCount: number
  panelWidth: number
  panelHeight: number
  gap: number
}): AutoroutingPhaseSnapshotGrid {
  if (panelCount < 1) {
    throw new Error("Cannot calculate a grid without panels")
  }

  const panelPairCount = Math.ceil(panelCount / 2)
  const panelPairWidth = panelWidth * 2 + gap
  let closestGrid: AutoroutingPhaseSnapshotGrid = {
    columnCount: 2,
    rowCount: panelPairCount,
  }
  let closestAspectRatioDistance = Number.POSITIVE_INFINITY

  for (
    let panelPairColumnCount = 1;
    panelPairColumnCount <= panelPairCount;
    panelPairColumnCount++
  ) {
    const rowCount = Math.ceil(panelPairCount / panelPairColumnCount)
    const gridWidth =
      panelPairWidth * panelPairColumnCount + gap * (panelPairColumnCount - 1)
    const gridHeight = panelHeight * rowCount + gap * (rowCount - 1)
    const aspectRatioDistance = Math.abs(Math.log(gridWidth / gridHeight))

    if (aspectRatioDistance < closestAspectRatioDistance) {
      closestGrid = {
        columnCount: panelPairColumnCount * 2,
        rowCount,
      }
      closestAspectRatioDistance = aspectRatioDistance
    }
  }

  return closestGrid
}
