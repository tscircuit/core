import { type Bounds, doBoundsOverlap } from "@tscircuit/math-utils"
import { schematicSectionProps } from "@tscircuit/props"
import {
  calculateCellBoundaries,
  computeBoundsFromCellContents,
} from "calculate-cell-boundaries"
import type { SchematicSheet } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

type SchematicSheetId = SchematicSheet["schematic_sheet_id"]

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
  _computeSectionMemberBounds({
    board,
    sectionName,
    schematicSheetId,
  }: {
    board: PrimitiveComponent
    sectionName: string | null
    schematicSheetId: SchematicSheetId | undefined
  }): Bounds[] {
    const { db } = this.root!

    const members = board
      .getDescendants()
      .filter((c) => c.getSchematicSectionName() === sectionName)

    const memberBounds: Bounds[] = []

    for (const member of members) {
      const schematicComponentId = (member as any).schematic_component_id
      if (!schematicComponentId) continue
      const schComp = db.schematic_component.get(schematicComponentId)
      if (!schComp) continue
      if (schComp.schematic_sheet_id !== schematicSheetId) continue

      const hw = schComp.size.width / 2
      const hh = schComp.size.height / 2
      memberBounds.push({
        minX: schComp.center.x - hw,
        maxX: schComp.center.x + hw,
        minY: schComp.center.y - hh,
        maxY: schComp.center.y + hh,
      })
    }

    return memberBounds
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
      .map((section, cellId) => {
        const memberBounds = section._computeSectionMemberBounds({
          board,
          sectionName: section._parsedProps.name,
          schematicSheetId,
        })
        if (memberBounds.length === 0) return null
        const rawBounds = computeBoundsFromCellContents(memberBounds)
        return {
          cellId,
          displayName: section._parsedProps.displayName,
          sectionTitleFontSize: section._parsedProps.sectionTitleFontSize,
          memberBounds,
          rawBounds,
          cell: {
            minX: rawBounds.minX - PADDING,
            maxX: rawBounds.maxX + PADDING,
            minY: rawBounds.minY - PADDING,
            maxY: rawBounds.maxY + PADDING,
          },
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)

    // Include unsectioned components (no schSectionName) as a virtual section
    const unsectionedMemberBounds = this._computeSectionMemberBounds({
      board,
      sectionName: null,
      schematicSheetId,
    })
    const allSectionsWithBounds = [...namedSectionsWithBounds]
    if (unsectionedMemberBounds.length > 0) {
      const rawBounds = computeBoundsFromCellContents(unsectionedMemberBounds)
      allSectionsWithBounds.push({
        cellId: allSections.length,
        displayName: undefined,
        sectionTitleFontSize: undefined,
        memberBounds: unsectionedMemberBounds,
        rawBounds,
        cell: {
          minX: rawBounds.minX - PADDING,
          maxX: rawBounds.maxX + PADDING,
          minY: rawBounds.minY - PADDING,
          maxY: rawBounds.maxY + PADDING,
        },
      })
    }

    if (allSectionsWithBounds.length === 0) return

    const outer = computeBoundsFromCellContents(
      allSectionsWithBounds.map((section) => section.cell),
    )

    // Internal dividing lines: use raw (unpadded) bounds so adjacent sections
    // with small gaps don't overlap and prevent divider generation
    const CELL_MARGIN = 1
    let dividers: ReturnType<typeof calculateCellBoundaries> = []
    if (allSectionsWithBounds.length > 1) {
      dividers = calculateCellBoundaries(
        allSectionsWithBounds.flatMap((sectionWithBounds) => {
          const overlapsAnotherSection = allSectionsWithBounds.some(
            (section) =>
              section !== sectionWithBounds &&
              doBoundsOverlap(section.rawBounds, sectionWithBounds.rawBounds),
          )
          let boundaryMemberBounds = [sectionWithBounds.rawBounds]
          if (overlapsAnotherSection) {
            // Member bounds preserve non-convex section topology only where
            // aggregate section bounds cannot be separated.
            boundaryMemberBounds = sectionWithBounds.memberBounds
          }
          return boundaryMemberBounds.map((memberBounds) => ({
            cellId: sectionWithBounds.cellId,
            minX: memberBounds.minX - CELL_MARGIN,
            maxX: memberBounds.maxX + CELL_MARGIN,
            minY: memberBounds.minY - CELL_MARGIN,
            maxY: memberBounds.maxY + CELL_MARGIN,
          }))
        }),
      )
    }
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
      let topBoundary = outer.maxY
      if (overlapsAnotherSection) {
        topBoundary = cell.maxY
      }
      if (dividersAbove.length > 0) {
        topBoundary = Math.min(...dividersAbove)
      }

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
