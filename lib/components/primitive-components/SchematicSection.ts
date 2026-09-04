import { type Bounds, doBoundsOverlap } from "@tscircuit/math-utils"
import { schematicSectionProps } from "@tscircuit/props"
import {
  calculateCellBoundaries,
  computeBoundsFromCellContents,
} from "calculate-cell-boundaries"
import type { SchematicSheet } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

type SchematicSheetId = SchematicSheet["schematic_sheet_id"]

const boundsFormSingleOverlapCluster = (bounds: Bounds[]) => {
  const firstBounds = bounds[0]
  if (!firstBounds) return false

  const connectedBounds = [firstBounds]
  const remainingBounds = bounds.slice(1)
  while (remainingBounds.length > 0) {
    const nextIndex = remainingBounds.findIndex((candidate) =>
      connectedBounds.some((connected) =>
        doBoundsOverlap(connected, candidate),
      ),
    )
    if (nextIndex < 0) return false
    connectedBounds.push(...remainingBounds.splice(nextIndex, 1))
  }
  return true
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

  // Pass null to compute bounds for components with no schSectionName
  _computeSectionBounds(
    board: PrimitiveComponent,
    sectionName: string | null,
    schematicSheetId: SchematicSheetId | undefined,
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
      if (schComp.schematic_sheet_id !== schematicSheetId) continue

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

    const schematicSheetId = this._resolveSchematicSheetId()

    // Only the first SchematicSection on each sheet renders that sheet's
    // sections. Sheetless sections continue to share the implicit sheet.
    const allSections = board
      .getDescendants()
      .filter(
        (component): component is SchematicSection =>
          component instanceof SchematicSection &&
          component._resolveSchematicSheetId() === schematicSheetId,
      )

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
          schematicSheetId,
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
    const unsectionedBounds = this._computeSectionBounds(
      board,
      null,
      schematicSheetId,
    )
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

    const CELL_MARGIN = 1
    const expandedSectionBounds = allSectionsWithBounds.map((s) => ({
      minX: s.rawBounds.minX - CELL_MARGIN,
      maxX: s.rawBounds.maxX + CELL_MARGIN,
      minY: s.rawBounds.minY - CELL_MARGIN,
      maxY: s.rawBounds.maxY + CELL_MARGIN,
    }))
    let dividerCells = expandedSectionBounds
    // Equal margins do not move midpoints. If they connect every section,
    // they only erase the section topology, so use the actual bounds.
    if (boundsFormSingleOverlapCluster(expandedSectionBounds)) {
      dividerCells = allSectionsWithBounds.map((s) => s.rawBounds)
    }
    const dividers = calculateCellBoundaries(dividerCells)
    for (const line of dividers) {
      db.schematic_line.insert({
        x1: line.start.x,
        y1: line.start.y,
        x2: line.end.x,
        y2: line.end.y,
        stroke_width: STROKE_WIDTH,
        color: "#000000",
        is_dashed: true,
        schematic_sheet_id: schematicSheetId,
      })
    }

    const hDividers = dividers.filter(
      (l) => Math.abs(l.start.y - l.end.y) < TOL,
    )
    const vDividers = dividers.filter(
      (l) => Math.abs(l.start.x - l.end.x) < TOL,
    )

    for (const sectionWithBounds of allSectionsWithBounds) {
      const { displayName, sectionTitleFontSize, rawBounds, cell } =
        sectionWithBounds
      if (!displayName) continue

      const overlapsAnotherSection = allSectionsWithBounds.some(
        (section) =>
          section !== sectionWithBounds &&
          doBoundsOverlap(section.rawBounds, rawBounds),
      )

      const dividersAbove = hDividers
        .map((l) => l.start.y)
        .filter((y) => y > rawBounds.maxY)
      const topBoundary =
        dividersAbove.length > 0 ? Math.min(...dividersAbove) : outer.maxY

      const dividersToLeft = vDividers
        .map((l) => l.start.x)
        .filter((x) => x < rawBounds.minX)
      let leftBoundary = outer.minX
      if (overlapsAnotherSection) {
        leftBoundary = cell.minX
      }
      if (dividersToLeft.length > 0) {
        leftBoundary = Math.max(...dividersToLeft)
      }

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
        schematic_sheet_id: schematicSheetId,
      })
    }
  }
}
