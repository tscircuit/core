import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import {
  calculateCellBoundaries,
  computeBoundsFromCellContents,
} from "calculate-cell-boundaries"
import { schematicSectionProps } from "@tscircuit/props"

type SectionBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export class SchematicSection extends PrimitiveComponent<
  typeof schematicSectionProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicSection",
      zodProps: schematicSectionProps,
    }
  }

  _computeSectionBounds(board: PrimitiveComponent): SectionBounds | null {
    const { db } = this.root!
    const { name } = this._parsedProps

    const members = board
      .getDescendants()
      .filter((c: any) => c.props?.schSectionName === name)

    if (members.length === 0) return null

    const positions: SectionBounds[] = []

    for (const member of members) {
      const schematicComponentId = (member as any).schematic_component_id
      if (!schematicComponentId) continue
      const schComp = db.schematic_component.get(schematicComponentId)
      if (!schComp) continue

      const hw = schComp.size.width / 2
      const hh = schComp.size.height / 2
      positions.push({
        minX: schComp.center.x - hw,
        maxX: schComp.center.x + hw,
        minY: schComp.center.y - hh,
        maxY: schComp.center.y + hh,
      })
    }

    if (positions.length === 0) return null
    return computeBoundsFromCellContents(positions)
  }

  doInitialSchematicTraceRender(): void {
    if (this.root?.schematicDisabled) return

    const board = this.root?._getBoard()
    if (!board) return

    // Only the first SchematicSection in the tree renders everything
    const allSections = board
      .getDescendants()
      .filter((c): c is SchematicSection => c instanceof SchematicSection)

    if (allSections[0] !== this) return

    const { db } = this.root!
    const PADDING = 0.5
    const LABEL_PADDING = 0.2
    const STROKE_WIDTH = 0.02
    const TOL = 0.001

    // Collect each section's raw and padded bbox
    const sectionData = allSections
      .map((section) => {
        const bounds = section._computeSectionBounds(board)
        if (!bounds) return null
        return {
          section,
          rawBounds: bounds,
          cell: {
            minX: bounds.minX - PADDING,
            maxX: bounds.maxX + PADDING,
            minY: bounds.minY - PADDING,
            maxY: bounds.maxY + PADDING,
          },
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)

    if (sectionData.length === 0) return

    const allCells = sectionData.map((s) => s.cell)

    const outer = computeBoundsFromCellContents(allCells)

    // Internal dividing lines: use raw (unpadded) bounds so adjacent sections
    // with small gaps don't overlap and prevent divider generation
    const dividers = calculateCellBoundaries(
      sectionData.map((s) => s.rawBounds),
    )
    for (const line of dividers) {
      db.schematic_line.insert({
        x1: line.start.x,
        y1: line.start.y,
        x2: line.end.x,
        y2: line.end.y,
        stroke_width: STROKE_WIDTH,
        color: "#000000",
        is_dashed: false,
      })
    }

    const hDividers = dividers.filter(
      (l) => Math.abs(l.start.y - l.end.y) < TOL,
    )
    const vDividers = dividers.filter(
      (l) => Math.abs(l.start.x - l.end.x) < TOL,
    )

    // Label for each section at the top-left of its region within the outer box.
    // Top boundary = nearest horizontal divider above cell.minY, else outer.maxY.
    // Left boundary = nearest vertical divider left of rawBounds.minX, else outer.minX.
    for (const { section, cell, rawBounds } of sectionData) {
      const { displayName } = section._parsedProps
      if (!displayName) continue

      const dividersAbove = hDividers
        .map((l) => l.start.y)
        .filter((y) => y > cell.minY)
      const topBoundary =
        dividersAbove.length > 0 ? Math.min(...dividersAbove) : outer.maxY

      const dividersToLeft = vDividers
        .map((l) => l.start.x)
        .filter((x) => x < rawBounds.minX)
      const leftBoundary =
        dividersToLeft.length > 0 ? Math.max(...dividersToLeft) : outer.minX

      db.schematic_text.insert({
        anchor: "top_left",
        text: displayName,
        font_size: 0.18,
        color: "#000000",
        position: {
          x: leftBoundary + LABEL_PADDING,
          y: topBoundary - LABEL_PADDING,
        },
        rotation: 0,
      })
    }
  }
}
