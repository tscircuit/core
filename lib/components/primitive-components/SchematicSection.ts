import { type Bounds, doBoundsOverlap } from "@tscircuit/math-utils"
import { schematicSectionProps } from "@tscircuit/props"
import {
  calculateCellBoundaries,
  computeBoundsFromCellContents,
} from "calculate-cell-boundaries"
import type { SchematicSheet } from "circuit-json"
import {
  getSchematicComponentWithTextBounds,
  getSchematicTextBounds,
} from "lib/utils/schematic/getSchematicComponentWithTextBounds"
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

  private _computeSectionDetails(
    schematicRoot: PrimitiveComponent,
    sectionName: string | null,
    schematicSheetId: SchematicSheetId | undefined,
  ): { bounds: Bounds; memberBounds: Bounds[] } | null {
    const { db } = this.root!

    const members = schematicRoot
      .getDescendants()
      .filter((c) => c.getSchematicSectionName() === sectionName)

    if (members.length === 0) return null

    const positions: Bounds[] = []
    const memberBounds: Bounds[] = []

    for (const member of members) {
      const schematicComponentId = (member as any).schematic_component_id
      if (!schematicComponentId) continue
      const schComp = db.schematic_component.get(schematicComponentId)
      if (!schComp) continue
      if (schComp.schematic_sheet_id !== schematicSheetId) continue

      const hw = schComp.size.width / 2
      const hh = schComp.size.height / 2
      const memberPositions: Bounds[] = [
        {
          minX: schComp.center.x - hw,
          maxX: schComp.center.x + hw,
          minY: schComp.center.y - hh,
          maxY: schComp.center.y + hh,
        },
      ]
      // Chip and schematic-box reference/value labels extend outside the body.
      for (const text of db.schematic_text.list({
        schematic_component_id: schematicComponentId,
      })) {
        memberPositions.push(
          getSchematicTextBounds({
            text: text.text,
            position: text.position,
            anchor: text.anchor,
            fontSize: text.font_size,
          }),
        )
      }
      positions.push(...memberPositions)
      memberBounds.push(computeBoundsFromCellContents(memberPositions))
    }

    if (positions.length === 0) return null
    return {
      bounds: computeBoundsFromCellContents(positions),
      memberBounds,
    }
  }

  // Pass null to compute bounds for components with no schSectionName
  _computeSectionBounds(
    schematicRoot: PrimitiveComponent,
    sectionName: string | null,
    schematicSheetId: SchematicSheetId | undefined,
  ): Bounds | null {
    return (
      this._computeSectionDetails(schematicRoot, sectionName, schematicSheetId)
        ?.bounds ?? null
    )
  }

  doInitialSchematicSectionRender(): void {
    if (this.root?.schematicDisabled) return

    // Standalone subcircuits retain the same section-based routing as boards.
    const root = this.root
    const schematicRoot =
      root?._getBoard() ??
      (root?.firstChild?.isSubcircuit ? root.firstChild : undefined)
    if (!schematicRoot) return

    const schematicSheetId = this._resolveSchematicSheetId()

    // Only the first SchematicSection on each sheet renders that sheet's
    // sections. Sheetless sections continue to share the implicit sheet.
    const allSections = schematicRoot
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
        const details = section._computeSectionDetails(
          schematicRoot,
          section._parsedProps.name,
          schematicSheetId,
        )
        if (!details) return null
        const { bounds, memberBounds } = details
        return {
          displayName: section._parsedProps.displayName,
          sectionTitleFontSize: section._parsedProps.sectionTitleFontSize,
          rawBounds: bounds,
          memberBounds,
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
    const unsectionedDetails = this._computeSectionDetails(
      schematicRoot,
      null,
      schematicSheetId,
    )
    const allSectionsWithBounds = [...namedSectionsWithBounds]
    if (unsectionedDetails)
      allSectionsWithBounds.push({
        displayName: undefined,
        sectionTitleFontSize: undefined,
        rawBounds: unsectionedDetails.bounds,
        memberBounds: unsectionedDetails.memberBounds,
        cell: {
          minX: unsectionedDetails.bounds.minX - PADDING,
          maxX: unsectionedDetails.bounds.maxX + PADDING,
          minY: unsectionedDetails.bounds.minY - PADDING,
          maxY: unsectionedDetails.bounds.maxY + PADDING,
        },
      })

    if (allSectionsWithBounds.length === 0) return

    const allCells = allSectionsWithBounds.map((s) => s.cell)

    const outer = computeBoundsFromCellContents(allCells)

    const dividers = calculateCellBoundaries(
      allSectionsWithBounds.map((s) => s.rawBounds),
      { cellMargin: 1 },
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

    let cachedObstacleBounds: Bounds[] | undefined
    const getObstacleBounds = (): Bounds[] => {
      if (cachedObstacleBounds) return cachedObstacleBounds
      const obstacles: Bounds[] = allSectionsWithBounds.flatMap(
        (section) => section.memberBounds,
      )
      for (const schComp of db.schematic_component.list()) {
        if (schComp.schematic_sheet_id !== schematicSheetId) continue
        const withText = getSchematicComponentWithTextBounds({
          db,
          schematicComponent: schComp,
        })
        if (withText) {
          obstacles.push(withText)
        } else {
          const hw = schComp.size.width / 2
          const hh = schComp.size.height / 2
          obstacles.push({
            minX: schComp.center.x - hw,
            maxX: schComp.center.x + hw,
            minY: schComp.center.y - hh,
            maxY: schComp.center.y + hh,
          })
        }
      }
      for (const text of db.schematic_text.list()) {
        if (text.schematic_sheet_id !== schematicSheetId) continue
        obstacles.push(
          getSchematicTextBounds({
            text: text.text,
            position: text.position,
            anchor: text.anchor,
            fontSize: text.font_size,
          }),
        )
      }
      cachedObstacleBounds = obstacles
      return obstacles
    }

    const placedTitleBounds: Bounds[] = []

    for (const sectionWithBounds of allSectionsWithBounds) {
      const {
        displayName,
        sectionTitleFontSize,
        rawBounds,
        memberBounds,
        cell,
      } = sectionWithBounds
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

      const fontSize = sectionTitleFontSize ?? 0.18
      const defaultPosition = {
        x: leftBoundary + LABEL_PADDING,
        // A top-left anchor extends downwards by the title's font size.
        y: Math.max(
          topBoundary - LABEL_PADDING,
          rawBounds.maxY + LABEL_PADDING + fontSize,
        ),
      }
      const getTitleBoundsAt = (position: { x: number; y: number }) =>
        getSchematicTextBounds({
          text: displayName,
          position,
          anchor: "top_left",
          fontSize,
        })

      const otherMemberBounds = overlapsAnotherSection
        ? allSectionsWithBounds
            .filter((section) => section !== sectionWithBounds)
            .flatMap((section) => section.memberBounds)
        : []

      const collidesWithPlacedTitle = (bounds: Bounds) =>
        placedTitleBounds.some((placed) => doBoundsOverlap(bounds, placed))

      const isShadowedByOtherSection = (bounds: Bounds, anchorMinX: number) => {
        if (!overlapsAnotherSection || otherMemberBounds.length === 0) {
          return false
        }
        const bandMinX = Math.min(anchorMinX, bounds.minX)
        const bandMaxX = Math.max(anchorMinX + PADDING, bounds.maxX)
        const ownInBand = memberBounds.filter(
          (m) => m.maxX > bandMinX + TOL && m.minX < bandMaxX - TOL,
        )
        const ownTopY =
          ownInBand.length > 0
            ? Math.max(...ownInBand.map((m) => m.maxY))
            : Number.NEGATIVE_INFINITY
        return otherMemberBounds.some(
          (other) =>
            other.maxX > bandMinX + TOL &&
            other.minX < bandMaxX - TOL &&
            other.maxY > ownTopY + TOL &&
            other.minY < bounds.minY + TOL,
        )
      }

      let chosenPosition = defaultPosition
      let chosenBounds = getTitleBoundsAt(defaultPosition)

      if (
        collidesWithPlacedTitle(chosenBounds) ||
        isShadowedByOtherSection(chosenBounds, rawBounds.minX)
      ) {
        const obstacles = getObstacleBounds()
        const collidesWithObstacle = (bounds: Bounds) =>
          obstacles.some((obs) => doBoundsOverlap(bounds, obs))

        const sortedMembers = [...memberBounds].sort((a, b) =>
          Math.abs(b.maxY - a.maxY) > TOL ? b.maxY - a.maxY : a.minX - b.minX,
        )

        const candidateSpecs: Array<{
          position: { x: number; y: number }
          anchorMinX: number
        }> = []

        for (const member of sortedMembers) {
          const memberDividersLeft = vDividers
            .map((l) => l.start.x)
            .filter((x) => x < member.minX)
          const memberLeft =
            memberDividersLeft.length > 0
              ? Math.max(member.minX - PADDING, Math.max(...memberDividersLeft))
              : member.minX - PADDING
          candidateSpecs.push({
            position: {
              x: memberLeft + LABEL_PADDING,
              y: defaultPosition.y,
            },
            anchorMinX: member.minX,
          })
        }

        for (const member of sortedMembers) {
          const memberDividersLeft = vDividers
            .map((l) => l.start.x)
            .filter((x) => x < member.minX)
          const memberLeft =
            memberDividersLeft.length > 0
              ? Math.max(member.minX - PADDING, Math.max(...memberDividersLeft))
              : member.minX - PADDING
          candidateSpecs.push({
            position: {
              x: memberLeft + LABEL_PADDING,
              y: member.maxY + LABEL_PADDING + fontSize,
            },
            anchorMinX: member.minX,
          })
        }

        let resolved = false
        for (const candidate of candidateSpecs) {
          const candidateBounds = getTitleBoundsAt(candidate.position)
          if (
            !collidesWithPlacedTitle(candidateBounds) &&
            !collidesWithObstacle(candidateBounds) &&
            !isShadowedByOtherSection(candidateBounds, candidate.anchorMinX)
          ) {
            chosenPosition = candidate.position
            chosenBounds = candidateBounds
            resolved = true
            break
          }
        }

        if (!resolved) {
          const fallbackStart =
            candidateSpecs.find(
              (c) =>
                !isShadowedByOtherSection(
                  getTitleBoundsAt(c.position),
                  c.anchorMinX,
                ),
            )?.position ?? defaultPosition
          let pos = { ...fallbackStart }
          let bounds = getTitleBoundsAt(pos)

          const overlappingPlaced = placedTitleBounds.filter((placed) =>
            doBoundsOverlap(bounds, placed),
          )
          if (overlappingPlaced.length > 0) {
            const shiftedRight = {
              x:
                Math.max(...overlappingPlaced.map((placed) => placed.maxX)) +
                LABEL_PADDING,
              y: pos.y,
            }
            const shiftedRightBounds = getTitleBoundsAt(shiftedRight)
            if (
              shiftedRightBounds.maxX <= cell.maxX + TOL &&
              !collidesWithPlacedTitle(shiftedRightBounds) &&
              !collidesWithObstacle(shiftedRightBounds)
            ) {
              pos = shiftedRight
              bounds = shiftedRightBounds
              resolved = true
            }
          }

          if (!resolved) {
            for (let step = 0; step < 16; step++) {
              const blockers = [
                ...placedTitleBounds.filter((placed) =>
                  doBoundsOverlap(bounds, placed),
                ),
                ...obstacles.filter((obs) => doBoundsOverlap(bounds, obs)),
              ]
              if (blockers.length === 0) break
              pos = {
                x: pos.x,
                y:
                  Math.max(...blockers.map((b) => b.maxY)) +
                  LABEL_PADDING +
                  fontSize,
              }
              bounds = getTitleBoundsAt(pos)
            }
          }

          chosenPosition = pos
          chosenBounds = bounds
        }
      }

      placedTitleBounds.push(chosenBounds)
      db.schematic_text.insert({
        anchor: "top_left",
        text: displayName,
        font_size: fontSize,
        color: "#000000",
        position: chosenPosition,
        rotation: 0,
        schematic_sheet_id: schematicSheetId,
      })
    }
  }
}
