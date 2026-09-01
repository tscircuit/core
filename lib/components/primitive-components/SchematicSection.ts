import { type Bounds, doBoundsOverlap } from "@tscircuit/math-utils"
import { schematicSectionProps } from "@tscircuit/props"
import {
  calculateCellBoundaries,
  computeBoundsFromCellContents,
} from "calculate-cell-boundaries"
import type { SchematicComponent, SchematicSheet } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { getSchematicNetLabelBoundsForSection } from "./get-schematic-net-label-bounds-for-section"

type SchematicSheetId = SchematicSheet["schematic_sheet_id"]
type SchematicComponentId = SchematicComponent["schematic_component_id"]
type SectionBounds = Bounds & {
  labelPadding: {
    left: number
    right: number
    top: number
    bottom: number
  }
}
const SCHEMATIC_SECTION_PADDING = 0.5
const SCHEMATIC_SECTION_CELL_MARGIN = 1

const getSectionCellMargin = (labelPadding: number) => {
  if (labelPadding > 0) return SCHEMATIC_SECTION_PADDING
  return SCHEMATIC_SECTION_CELL_MARGIN
}

const getSectionCellBounds = (sectionBounds: SectionBounds): Bounds => ({
  minX:
    sectionBounds.minX - getSectionCellMargin(sectionBounds.labelPadding.left),
  maxX:
    sectionBounds.maxX + getSectionCellMargin(sectionBounds.labelPadding.right),
  minY:
    sectionBounds.minY -
    getSectionCellMargin(sectionBounds.labelPadding.bottom),
  maxY:
    sectionBounds.maxY + getSectionCellMargin(sectionBounds.labelPadding.top),
})

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
  ): SectionBounds | null {
    const { db } = this.root!

    const members = board
      .getDescendants()
      .filter((c) => c.getSchematicSectionName() === sectionName)

    if (members.length === 0) return null

    const positions: Bounds[] = []
    const memberSchematicComponentIds = new Set<SchematicComponentId>()

    for (const member of members) {
      const schematicComponentId = member.schematic_component_id
      if (!schematicComponentId) continue
      const schComp = db.schematic_component.get(schematicComponentId)
      if (!schComp) continue
      if (schComp.schematic_sheet_id !== schematicSheetId) continue

      memberSchematicComponentIds.add(schematicComponentId)

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
    const componentBounds = computeBoundsFromCellContents(positions)
    const netLabelBounds = getSchematicNetLabelBoundsForSection({
      db,
      schematicSheetId,
      memberSchematicComponentIds,
    })
    let leftPadding = 0
    let rightPadding = 0
    let topPadding = 0
    let bottomPadding = 0
    for (const bounds of netLabelBounds) {
      const width = bounds.maxX - bounds.minX
      const height = bounds.maxY - bounds.minY
      if (bounds.minX < componentBounds.minX) {
        leftPadding = Math.max(leftPadding, width)
      }
      if (bounds.maxX > componentBounds.maxX) {
        rightPadding = Math.max(rightPadding, width)
      }
      if (bounds.maxY > componentBounds.maxY) {
        topPadding = Math.max(topPadding, height)
      }
      if (bounds.minY < componentBounds.minY) {
        bottomPadding = Math.max(bottomPadding, height)
      }
    }

    return {
      minX: componentBounds.minX - leftPadding,
      maxX: componentBounds.maxX + rightPadding,
      minY: componentBounds.minY - bottomPadding,
      maxY: componentBounds.maxY + topPadding,
      labelPadding: {
        left: leftPadding,
        right: rightPadding,
        top: topPadding,
        bottom: bottomPadding,
      },
    }
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
            minX: bounds.minX - SCHEMATIC_SECTION_PADDING,
            maxX: bounds.maxX + SCHEMATIC_SECTION_PADDING,
            minY: bounds.minY - SCHEMATIC_SECTION_PADDING,
            maxY: bounds.maxY + SCHEMATIC_SECTION_PADDING,
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
          minX: unsectionedBounds.minX - SCHEMATIC_SECTION_PADDING,
          maxX: unsectionedBounds.maxX + SCHEMATIC_SECTION_PADDING,
          minY: unsectionedBounds.minY - SCHEMATIC_SECTION_PADDING,
          maxY: unsectionedBounds.maxY + SCHEMATIC_SECTION_PADDING,
        },
      })

    if (allSectionsWithBounds.length === 0) return

    const allCells = allSectionsWithBounds.map((s) => s.cell)

    const outer = computeBoundsFromCellContents(allCells)

    // Internal dividing lines: use raw (unpadded) bounds so adjacent sections
    // with small gaps don't overlap and prevent divider generation
    const dividers = calculateCellBoundaries(
      allSectionsWithBounds.map((section) =>
        getSectionCellBounds(section.rawBounds),
      ),
    )
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
