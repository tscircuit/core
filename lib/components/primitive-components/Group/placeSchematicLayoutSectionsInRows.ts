import type { Point } from "@tscircuit/math-utils"
import type { SectionBlock } from "./Group_doInitialSchematicLayoutSections"

export type PlacedSectionBlock = SectionBlock & {
  sectionCenterAfterPlacement: Point
}
type SectionName = string
type RowEntry = {
  sectionName: string
  x: number
  width: number
  height: number
}

const SECTION_GAP = 1.0 // schematic units between sections
const MARGIN = 1.5 // padding around each section's bounding box

export function computeSchematicSectionLayoutUsingRows({
  sectionBlocks,
  groupSchPositionBeforeLayout: groupOffset,
}: {
  sectionBlocks: SectionBlock[]
  groupSchPositionBeforeLayout: { x: number; y: number }
}): Map<SectionName, PlacedSectionBlock> {
  // target width = sqrt(total area) * 2 for a wide aspect ratio
  const totalArea = sectionBlocks.reduce((sum, s) => {
    const w = Math.max(s.size.x, 0.5) + MARGIN * 2
    const h = Math.max(s.size.y, 0.5) + MARGIN * 2
    return sum + w * h
  }, 0)
  const targetRowWidth = Math.sqrt(totalArea) * 2

  const rows: RowEntry[][] = []
  let currentRow: RowEntry[] = []
  let currentRowWidth = 0

  for (const section of sectionBlocks) {
    const w = Math.max(section.size.x, 0.5) + MARGIN * 2
    const h = Math.max(section.size.y, 0.5) + MARGIN * 2
    let neededWidth = w
    if (currentRowWidth > 0) neededWidth = currentRowWidth + SECTION_GAP + w

    if (currentRow.length > 0 && neededWidth > targetRowWidth) {
      rows.push(currentRow)
      currentRow = []
      currentRowWidth = 0
    }

    let x = 0
    if (currentRowWidth > 0) x = currentRowWidth + SECTION_GAP
    currentRow.push({
      sectionName: section.sectionName,
      x,
      width: w,
      height: h,
    })
    currentRowWidth = x + w
  }
  if (currentRow.length > 0) rows.push(currentRow)

  const sectionPlacements = new Map<SectionName, PlacedSectionBlock>()
  let rowY = 0

  for (const row of rows) {
    const rowHeight = Math.max(...row.map((e) => e.height))
    const rowTotalWidth = row[row.length - 1]!.x + row[row.length - 1]!.width
    const rowOffsetX = -rowTotalWidth / 2

    for (const entry of row) {
      sectionPlacements.set(entry.sectionName, {
        ...entry,
        x: rowOffsetX + entry.x + entry.width / 2 + groupOffset.x,
        y: rowY - rowHeight / 2 + groupOffset.y,
      })
    }
    rowY -= rowHeight + SECTION_GAP
  }

  return sectionPlacements
}
