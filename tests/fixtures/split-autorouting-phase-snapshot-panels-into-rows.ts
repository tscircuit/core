/**
 * Splits ordered snapshot panels into equal-width rows without separating a
 * horizontal START/END pair, padding the final row with blank panels.
 */
export function splitAutoroutingPhaseSnapshotPanelsIntoRows<T>({
  panels,
  columnCount,
  createBlankPanel,
}: {
  panels: T[]
  columnCount: number
  createBlankPanel: () => T
}): T[][] {
  if (columnCount < 2 || columnCount % 2 !== 0) {
    throw new Error("Panel rows must contain whole START/END pairs")
  }

  const rows: T[][] = []

  for (
    let panelIndex = 0;
    panelIndex < panels.length;
    panelIndex += columnCount
  ) {
    const row = panels.slice(panelIndex, panelIndex + columnCount)
    while (row.length < columnCount) row.push(createBlankPanel())
    rows.push(row)
  }

  return rows
}
