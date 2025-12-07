import type { PcbBoard, PcbCutout } from "circuit-json"
import * as Flatten from "@flatten-js/core"

type PointLike = { x: number; y: number }

export const generatePanelTabsAndMouseBitesForOutlines = (
  outline: PointLike[],
  otherBoards: PcbBoard[],
  options: {
    boardGap: number
    tabLength: number
    tabWidth: number
    mouseBites: boolean
    mouseBiteHoleDiameter: number
    mouseBiteHoleSpacing: number
  },
): {
  tabCutouts: PcbCutout[]
  mouseBiteHoles: PointLike[]
} => {
  const {
    boardGap,
    tabLength, // along edge
    tabWidth, // extrusion
    mouseBites,
    mouseBiteHoleDiameter,
    mouseBiteHoleSpacing,
  } = options

  const tabCutouts: PcbCutout[] = []
  const mouseBiteHoles: PointLike[] = []

  if (outline.length < 2) {
    return { tabCutouts, mouseBiteHoles }
  }

  const outlinePolygon = new Flatten.Polygon(
    outline.map((p) => Flatten.point(p.x, p.y)),
  )
  const otherBoardGeometries = otherBoards.map((b) =>
    b.outline
      ? new Flatten.Polygon(b.outline.map((p) => Flatten.point(p.x, p.y)))
      : b.width && b.height
        ? new Flatten.Box(
            b.center.x - b.width / 2,
            b.center.y - b.height / 2,
            b.center.x + b.width / 2,
            b.center.y + b.height / 2,
          )
        : null,
  )

  // Iterate over each segment of the outline
  for (let i = 0; i < outline.length; i++) {
    const p1 = outline[i]!
    const p2 = outline[(i + 1) % outline.length]!

    const segmentVector = Flatten.vector(p2.x - p1.x, p2.y - p1.y)
    const segmentLength = segmentVector.length
    // NOTE: boardGap is the "tab length", tabLength is the "gap length"
    const physicalTabLength = boardGap
    const cutoutLength = tabLength
    if (segmentLength < physicalTabLength) continue

    const segmentDirVec = segmentVector.normalize()

    const isHorizontal = Math.abs(segmentVector.y) < 1e-9
    const isVertical = Math.abs(segmentVector.x) < 1e-9
    const isAxisAligned = isHorizontal || isVertical

    // Determine outward normal
    let normalVec = segmentDirVec.rotate(Math.PI / 2)
    const midPoint = Flatten.point(p1.x, p1.y).translate(
      segmentDirVec.multiply(segmentLength / 2),
    )

    // Check if normal is pointing inwards, and flip if necessary
    const testPointInward = midPoint.translate(normalVec.multiply(0.01))
    if (outlinePolygon.contains(testPointInward)) {
      normalVec = normalVec.multiply(-1)
    }

    // Check if the edge is adjacent to another board
    const testPointOutward = midPoint.translate(
      normalVec.multiply((tabWidth + physicalTabLength) / 2),
    )
    let isExterior = true
    for (const geom of otherBoardGeometries) {
      if (geom?.contains(testPointOutward)) {
        isExterior = false
        break
      }
    }
    if (!isExterior) continue

    const numTabs = Math.max(
      1,
      Math.floor(segmentLength / (physicalTabLength + cutoutLength)),
    )

    const totalContentLength = numTabs * physicalTabLength
    const totalGapLength = segmentLength - totalContentLength
    const gapSize = totalGapLength / (numTabs + 1)
    if (gapSize < 0) continue

    const tabsOnSegment: { start: number; end: number }[] = []

    for (let j = 0; j < numTabs; j++) {
      const tabStartDist = gapSize * (j + 1) + physicalTabLength * j
      tabsOnSegment.push({
        start: tabStartDist,
        end: tabStartDist + physicalTabLength,
      })
    }

    const extrusion = normalVec.multiply(tabWidth)

    // Create cutouts in the gaps between tabs
    for (let j = 0; j <= numTabs; j++) {
      const gapStartDist = j === 0 ? 0 : tabsOnSegment[j - 1]!.end
      const gapEndDist = j === numTabs ? segmentLength : tabsOnSegment[j]!.start
      const gapLength = gapEndDist - gapStartDist
      if (gapLength < 1e-6) continue

      if (isAxisAligned) {
        const width = isHorizontal ? gapLength : tabWidth
        const height = isHorizontal ? tabWidth : gapLength
        const gapCenterAlongSegment = Flatten.point(p1.x, p1.y).translate(
          segmentDirVec.multiply(gapStartDist + gapLength / 2),
        )
        const center = gapCenterAlongSegment.translate(extrusion.multiply(0.5))

        tabCutouts.push({
          type: "pcb_cutout",
          shape: "rect",
          center,
          width,
          height,
          corner_radius: Math.min(width, height) / 2,
        } as any)
      } else {
        const width = gapLength
        const height = tabWidth
        const gapCenterAlongSegment = Flatten.point(p1.x, p1.y).translate(
          segmentDirVec.multiply(gapStartDist + gapLength / 2),
        )
        const center = gapCenterAlongSegment.translate(extrusion.multiply(0.5))

        const rotationDeg = (segmentDirVec.slope * 180) / Math.PI

        tabCutouts.push({
          type: "pcb_cutout",
          shape: "rect",
          center,
          width,
          height,
          rotation: rotationDeg,
          corner_radius: Math.min(width, height) / 2,
        } as any)
      }
    }

    if (mouseBites) {
      const holeSpacing = mouseBiteHoleDiameter + mouseBiteHoleSpacing
      // Create mousebites on the tabs
      for (const tab of tabsOnSegment) {
        const tabLength = tab.end - tab.start
        if (tabLength < holeSpacing) continue

        const numBitesInTab = Math.floor(tabLength / holeSpacing)
        if (numBitesInTab <= 0) continue

        const biteStartOffset =
          tab.start + (tabLength - (numBitesInTab - 1) * holeSpacing) / 2

        for (let k = 0; k < numBitesInTab; k++) {
          const biteDist = biteStartOffset + k * holeSpacing
          const pos = Flatten.point(p1.x, p1.y).translate(
            segmentDirVec.multiply(biteDist),
          )
          mouseBiteHoles.push({
            x: pos.x,
            y: pos.y,
          })
        }
      }
    }
  }

  return { tabCutouts, mouseBiteHoles }
}
