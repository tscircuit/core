import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import {
  calculateCellBoundaries,
  computeBoundsFromCellContents,
} from "calculate-cell-boundaries"
import { schematicSectionProps } from "@tscircuit/props"
import type { Bounds } from "@tscircuit/math-utils"

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

  // Pass null to compute bounds for components with no schSectionName
  _computeSectionBounds(
    board: PrimitiveComponent,
    sectionName: string | null,
  ): Bounds | null {
    const { db } = this.root!

    const members = board
      .getDescendants()
      .filter((c) => c.getSchematicSectionName() === sectionName)

    if (members.length === 0) return null

    const positions: Bounds[] = []

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

  doInitialSchematicSectionRender(): void {
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

    const namedSectionsWithBounds = allSections
      .map((section) => {
        const bounds = section._computeSectionBounds(
          board,
          section._parsedProps.name,
        )
        if (!bounds) return null
        return {
          displayName: section._parsedProps.displayName,
          sectionTitleFontSize: section._parsedProps.sectionTitleFontSize,
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

    // Include unsectioned components (no schSectionName) as a virtual section
    const unsectionedBounds = this._computeSectionBounds(board, null)
    const allSectionsWithBounds = [...namedSectionsWithBounds]
    if (unsectionedBounds)
      allSectionsWithBounds.push({
        displayName: undefined,
        sectionTitleFontSize: undefined,
        rawBounds: unsectionedBounds,
        cell: {
          minX: unsectionedBounds.minX - PADDING,
          maxX: unsectionedBounds.maxX + PADDING,
          minY: unsectionedBounds.minY - PADDING,
          maxY: unsectionedBounds.maxY + PADDING,
        },
      })

    if (allSectionsWithBounds.length === 0) return

    const allCells = allSectionsWithBounds.map((s) => s.cell)

    const outer = computeBoundsFromCellContents(allCells)

    // Internal dividing lines: use raw (unpadded) bounds so adjacent sections
    // with small gaps don't overlap and prevent divider generation
    const CELL_MARGIN = 1
    const dividers = calculateCellBoundaries(
      allSectionsWithBounds.map((s) => ({
        minX: s.rawBounds.minX - CELL_MARGIN,
        maxX: s.rawBounds.maxX + CELL_MARGIN,
        minY: s.rawBounds.minY - CELL_MARGIN,
        maxY: s.rawBounds.maxY + CELL_MARGIN,
      })),
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

    for (const {
      displayName,
      sectionTitleFontSize,
      rawBounds,
    } of allSectionsWithBounds) {
      if (!displayName) continue

      const dividersAbove = hDividers
        .map((l) => l.start.y)
        .filter((y) => y > rawBounds.maxY)
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
        font_size: sectionTitleFontSize ?? 0.18,
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
