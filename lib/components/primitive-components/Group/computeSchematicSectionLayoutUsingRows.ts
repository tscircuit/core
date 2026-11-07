type SectionName = string | null

type SectionLayoutInput = {
  sectionName: SectionName
  size: { x: number; y: number }
}

type ComputedSection = {
  sectionName: SectionName
  rowOffset: number
  width: number
  height: number
}

const SECTION_GAP = 1.0
const MARGIN = 1.5
const A4_SHEET_ASPECT_RATIO = Math.SQRT2
const A4_MAX_USABLE_ROW_WIDTH = 22.0

export function computeSchematicSectionLayoutUsingRows({
  sectionBlocks,
  groupSchPositionBeforeLayout: groupOffset,
  maxSheetWidth = A4_MAX_USABLE_ROW_WIDTH,
}: {
  sectionBlocks: SectionLayoutInput[]
  groupSchPositionBeforeLayout: { x: number; y: number }
  maxSheetWidth?: number
}): Map<SectionName, { x: number; y: number }> {
  let maxSingleSectionWidth = 0
  const totalArea = sectionBlocks.reduce((sum, block) => {
    const paddedWidth = Math.max(block.size.x, 0.5) + MARGIN * 2
    const paddedHeight = Math.max(block.size.y, 0.5) + MARGIN * 2
    maxSingleSectionWidth = Math.max(maxSingleSectionWidth, paddedWidth)
    return sum + paddedWidth * paddedHeight
  }, 0)
  const idealAspectWidth = Math.sqrt(totalArea * A4_SHEET_ASPECT_RATIO)
  const targetRowWidth = Math.max(
    maxSingleSectionWidth,
    Math.min(idealAspectWidth, maxSheetWidth),
  )

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

  const sectionPlacements = new Map<SectionName, { x: number; y: number }>()
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
