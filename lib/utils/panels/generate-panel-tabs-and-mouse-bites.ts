import type { PcbBoard, PcbCutout, PcbHoleCircle, Point } from "circuit-json"
import * as Flatten from "@flatten-js/core"

export const DEFAULT_TAB_LENGTH = 5
export const DEFAULT_TAB_WIDTH = 2

export const PANEL_GRID_SPACING = DEFAULT_TAB_WIDTH

interface PanelOptions {
  boardGap: number
  tabWidth: number
  tabLength: number
  mouseBites: boolean
}

interface MouseBite {
  x: number
  y: number
}

const generateCutoutsAndMousebitesForOutline = (
  outline: Point[],
  options: {
    gapLength: number
    cutoutWidth: number
    mouseBites: boolean
    mouseBiteHoleDiameter: number
    mouseBiteHoleSpacing: number
  },
): {
  tabCutouts: PcbCutout[]
  mouseBiteHoles: Point[]
} => {
  const {
    gapLength,
    cutoutWidth,
    mouseBites,
    mouseBiteHoleDiameter,
    mouseBiteHoleSpacing,
  } = options

  const tabCutouts: PcbCutout[] = []
  const mouseBiteHoles: Point[] = []

  if (outline.length < 2) {
    return { tabCutouts, mouseBiteHoles }
  }

  const outlinePolygon = new Flatten.Polygon(
    outline.map((p) => Flatten.point(p.x, p.y)),
  )

  // Determine winding order. A CCW polygon has its interior to the left of
  // its segments.
  let is_ccw: boolean
  if (outline.length > 2) {
    const p0 = Flatten.point(outline[0]!.x, outline[0]!.y)
    const p1 = Flatten.point(outline[1]!.x, outline[1]!.y)
    const segmentDir = Flatten.vector(p0, p1).normalize()
    const normalToLeft = segmentDir.rotate(Math.PI / 2)
    const midPoint = p0.translate(
      segmentDir.multiply(Flatten.segment(p0, p1).length / 2),
    )
    const testPoint = midPoint.translate(normalToLeft.multiply(0.01))
    is_ccw = outlinePolygon.contains(testPoint)
  } else {
    // Fallback for simple cases, though convexity doesn't really apply
    is_ccw = outlinePolygon.area() > 0
  }

  // Iterate over each segment of the outline
  for (let i = 0; i < outline.length; i++) {
    const p1_ = outline[i]!
    const p2_ = outline[(i + 1) % outline.length]!

    if (!p1_ || !p2_) continue

    const p1 = Flatten.point(p1_.x, p1_.y)
    const p2 = Flatten.point(p2_.x, p2_.y)

    const segment = Flatten.segment(p1, p2)
    const segmentLength = segment.length

    if (segmentLength < 1e-6) continue

    const segmentVec = Flatten.vector(p1, p2)
    const segmentDir = segmentVec.normalize()

    // Determine outward normal
    let normalVec = segmentDir.rotate(Math.PI / 2)
    const midPoint = segment.middle()

    // Check if normal is pointing inwards, and flip if necessary
    const testPoint = midPoint.translate(normalVec.multiply(0.01))
    if (outlinePolygon.contains(testPoint)) {
      normalVec = normalVec.multiply(-1)
    }

    const numBitesInGap = 2
    const totalBitesLength =
      numBitesInGap * mouseBiteHoleDiameter +
      (numBitesInGap - 1) * mouseBiteHoleSpacing

    let effectiveGapLength
    if (mouseBites) {
      effectiveGapLength = totalBitesLength
    } else {
      effectiveGapLength = gapLength
    }
    effectiveGapLength = Math.min(effectiveGapLength, segmentLength * 0.9)

    const gapStartDist = (segmentLength - effectiveGapLength) / 2
    const gapEndDist = gapStartDist + effectiveGapLength

    // Add mousebites in the gap
    if (mouseBites) {
      const holeAndSpacing = mouseBiteHoleDiameter + mouseBiteHoleSpacing
      if (effectiveGapLength >= totalBitesLength && holeAndSpacing > 0) {
        const firstBiteCenterOffsetInGap =
          (effectiveGapLength - totalBitesLength) / 2 +
          mouseBiteHoleDiameter / 2
        const firstBiteDistFromP1 = gapStartDist + firstBiteCenterOffsetInGap

        for (let k = 0; k < numBitesInGap; k++) {
          const biteDist = firstBiteDistFromP1 + k * holeAndSpacing
          const pos = p1.translate(segmentDir.multiply(biteDist))
          mouseBiteHoles.push({ x: pos.x, y: pos.y })
        }
      }
    }

    // Check convexity of start and end points of the segment for corner extension
    const p_prev_ = outline[(i - 1 + outline.length) % outline.length]!
    const p_next_ = outline[(i + 2) % outline.length]!
    let start_ext = 0
    let end_ext = 0

    if (p_prev_ && p_next_) {
      const vec_in_p1 = Flatten.vector(Flatten.point(p_prev_.x, p_prev_.y), p1)
      const p1_cross = vec_in_p1.cross(segmentVec)
      const is_p1_convex = is_ccw ? p1_cross > 1e-9 : p1_cross < -1e-9

      const vec_out_p2 = Flatten.vector(p2, Flatten.point(p_next_.x, p_next_.y))
      const p2_cross = segmentVec.cross(vec_out_p2)
      const is_p2_convex = is_ccw ? p2_cross > 1e-9 : p2_cross < -1e-9

      if (is_p1_convex) {
        let angle = vec_in_p1.angleTo(segmentVec)
        if (angle > Math.PI) angle = 2 * Math.PI - angle
        start_ext = cutoutWidth * Math.tan(angle / 2)
      } else {
        start_ext = 0
      }

      if (is_p2_convex) {
        let angle = segmentVec.angleTo(vec_out_p2)
        if (angle > Math.PI) angle = 2 * Math.PI - angle
        end_ext = cutoutWidth * Math.tan(angle / 2)
      } else {
        end_ext = 0
      }
    }

    // Create cutouts on both sides of the gap, extending them to overlap at corners
    const cutoutParts = [
      { start: 0 - start_ext, end: gapStartDist },
      { start: gapEndDist, end: segmentLength + end_ext },
    ]

    const extrusion = normalVec.multiply(cutoutWidth)

    for (const part of cutoutParts) {
      const partLength = part.end - part.start
      if (partLength < 1e-6) continue

      const partCenterAlongSegment = p1.translate(
        segmentDir.multiply(part.start + partLength / 2),
      )
      const center = partCenterAlongSegment.translate(extrusion.multiply(0.5))

      const width = partLength
      const height = cutoutWidth
      const rotationDeg = (segmentDir.slope * 180) / Math.PI

      tabCutouts.push({
        type: "pcb_cutout",
        shape: "rect",
        center: { x: center.x, y: center.y },
        width,
        height,
        rotation: rotationDeg,
        corner_radius: cutoutWidth / 2,
      } as any)
    }
  }

  return { tabCutouts, mouseBiteHoles }
}

export function generatePanelTabsAndMouseBites(
  boards: PcbBoard[],
  options: PanelOptions,
): {
  tabCutouts: PcbCutout[]
  mouseBiteHoles: PcbHoleCircle[]
} {
  const finalTabCutouts: PcbCutout[] = []
  const allMouseBites: MouseBite[] = []

  let { tabWidth, tabLength, mouseBites: useMouseBites } = options

  // Scale tab sizes based on board dimensions for small boards
  const boardSizes = boards.map((board) => ({
    width: board.width || 0,
    height: board.height || 0,
  }))

  if (boardSizes.length > 0) {
    const minBoardWidth = Math.min(...boardSizes.map((b) => b.width))
    const minBoardHeight = Math.min(...boardSizes.map((b) => b.height))
    const minBoardDimension = Math.min(minBoardWidth, minBoardHeight)

    const scaleFactor = minBoardDimension / 20 // mm
    tabWidth = Math.min(
      tabWidth,
      DEFAULT_TAB_WIDTH * Math.max(scaleFactor, 0.3),
    )
    tabLength = Math.min(
      tabLength,
      DEFAULT_TAB_LENGTH * Math.max(scaleFactor, 0.3),
    )
  }

  const processedBoards: PcbBoard[] = boards.map((board) => {
    if (
      (!board.outline || board.outline.length === 0) &&
      board.width &&
      board.height
    ) {
      const w2 = board.width / 2
      const h2 = board.height / 2
      return {
        ...board,
        outline: [
          { x: board.center.x - w2, y: board.center.y - h2 },
          { x: board.center.x + w2, y: board.center.y - h2 },
          { x: board.center.x + w2, y: board.center.y + h2 },
          { x: board.center.x - w2, y: board.center.y + h2 },
        ],
      }
    }
    return board
  })

  for (const board of processedBoards) {
    if (board.outline && board.outline.length > 0) {
      const mouseBiteDiameter = tabWidth * 0.45
      const mouseBiteSpacing = mouseBiteDiameter * 0.1

      const generated = generateCutoutsAndMousebitesForOutline(board.outline, {
        gapLength: tabLength,
        cutoutWidth: tabWidth,
        mouseBites: useMouseBites,
        mouseBiteHoleDiameter: mouseBiteDiameter,
        mouseBiteHoleSpacing: mouseBiteSpacing,
      })

      finalTabCutouts.push(...generated.tabCutouts)
      allMouseBites.push(...generated.mouseBiteHoles)
    }
  }

  const tabCutouts: PcbCutout[] = finalTabCutouts.map((tab, index) => ({
    ...tab,
    pcb_cutout_id: `panel_tab_${index}`,
  }))

  const mouseBiteDiameter = tabWidth * 0.45
  const mouseBiteHoles: PcbHoleCircle[] = allMouseBites.map((bite, index) => ({
    type: "pcb_hole",
    pcb_hole_id: `panel_mouse_bite_${index}`,
    hole_shape: "circle",
    hole_diameter: mouseBiteDiameter,
    x: bite.x,
    y: bite.y,
  }))

  return {
    tabCutouts,
    mouseBiteHoles,
  }
}
