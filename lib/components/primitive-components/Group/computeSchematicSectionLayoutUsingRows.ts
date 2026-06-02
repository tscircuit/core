type SectionLayoutInput = {
  sectionName: string
  size: { x: number; y: number }
}

type ComputedSection = {
  sectionName: string
  rowOffset: number
  width: number
  height: number
}

const SECTION_GAP = 1.0
const MARGIN = 1.5

export function computeSchematicSectionLayoutUsingRows({
  sectionBlocks,
  groupSchPositionBeforeLayout: groupOffset,
}: {
  sectionBlocks: SectionLayoutInput[]
  groupSchPositionBeforeLayout: { x: number; y: number }
}): Map<string, { x: number; y: number }> {
  const totalArea = sectionBlocks.reduce((sum, block) => {
    const paddedWidth = Math.max(block.size.x, 0.5) + MARGIN * 2
    const paddedHeight = Math.max(block.size.y, 0.5) + MARGIN * 2
    return sum + paddedWidth * paddedHeight
  }, 0)
  const targetRowWidth = Math.sqrt(totalArea) * 2

  const computedSectionsMatrix: ComputedSection[][] = []
  let currentSectionRow: ComputedSection[] = []
  let currentRowSectionWidth = 0

  for (const section of sectionBlocks) {
    const paddedWidth = Math.max(section.size.x, 0.5) + MARGIN * 2
    const paddedHeight = Math.max(section.size.y, 0.5) + MARGIN * 2
    const neededWidth =
      currentRowSectionWidth > 0
        ? currentRowSectionWidth + SECTION_GAP + paddedWidth
        : paddedWidth

    if (currentSectionRow.length > 0 && neededWidth > targetRowWidth) {
      computedSectionsMatrix.push(currentSectionRow)
      currentSectionRow = []
      currentRowSectionWidth = 0
    }

    const xOffsetInRow =
      currentRowSectionWidth > 0 ? currentRowSectionWidth + SECTION_GAP : 0
    currentSectionRow.push({
      sectionName: section.sectionName,
      rowOffset: xOffsetInRow,
      width: paddedWidth,
      height: paddedHeight,
    })
    currentRowSectionWidth = xOffsetInRow + paddedWidth
  }
  if (currentSectionRow.length > 0)
    computedSectionsMatrix.push(currentSectionRow)

  const sectionPlacements = new Map<string, { x: number; y: number }>()
  let rowY = 0

  for (const sectionRow of computedSectionsMatrix) {
    const rowHeight = Math.max(...sectionRow.map((rowEntry) => rowEntry.height))
    const rowWidth =
      sectionRow[sectionRow.length - 1]!.rowOffset +
      sectionRow[sectionRow.length - 1]!.width
    const rowCenteringOffsetX = -rowWidth / 2

    for (const section of sectionRow) {
      sectionPlacements.set(section.sectionName, {
        x:
          rowCenteringOffsetX +
          section.rowOffset +
          section.width / 2 +
          groupOffset.x,
        y: rowY - rowHeight / 2 + groupOffset.y,
      })
    }
    rowY -= rowHeight + SECTION_GAP
  }

  return sectionPlacements
}
