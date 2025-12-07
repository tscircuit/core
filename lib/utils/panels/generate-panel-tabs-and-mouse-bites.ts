import type {
  PcbBoard,
  PcbCutout,
  PcbCutoutRect,
  PcbHoleCircle,
} from "circuit-json"
import { generatePanelTabsAndMouseBitesForOutlines } from "./generate-panel-tabs-and-mousebites-for-outlines"

export const DEFAULT_PANEL_MARGIN = 5
export const DEFAULT_TAB_LENGTH = 5
export const DEFAULT_TAB_WIDTH = 2

export const PANEL_GRID_SPACING = DEFAULT_TAB_WIDTH

interface PanelOptions {
  boardGap: number
  tabWidth: number
  tabLength: number
  mouseBites: boolean
}

interface TabCutout {
  center: { x: number; y: number }
  width: number
  height: number
  boardId?: string
}

interface MouseBite {
  x: number
  y: number
}

function rectanglesOverlap(
  rect1: { center: { x: number; y: number }; width: number; height: number },
  rect2: { center: { x: number; y: number }; width: number; height: number },
): boolean {
  const r1Left = rect1.center.x - rect1.width / 2
  const r1Right = rect1.center.x + rect1.width / 2
  const r1Bottom = rect1.center.y - rect1.height / 2
  const r1Top = rect1.center.y + rect1.height / 2

  const r2Left = rect2.center.x - rect2.width / 2
  const r2Right = rect2.center.x + rect2.width / 2
  const r2Bottom = rect2.center.y - rect2.height / 2
  const r2Top = rect2.center.y + rect2.height / 2

  return !(
    r1Right <= r2Left ||
    r1Left >= r2Right ||
    r1Top <= r2Bottom ||
    r1Bottom >= r2Top
  )
}

function pointOverlapsRectangle(
  point: { x: number; y: number },
  radius: number,
  rect: { center: { x: number; y: number }; width: number; height: number },
): boolean {
  const rectLeft = rect.center.x - rect.width / 2
  const rectRight = rect.center.x + rect.width / 2
  const rectBottom = rect.center.y - rect.height / 2
  const rectTop = rect.center.y + rect.height / 2

  const closestX = Math.max(rectLeft, Math.min(point.x, rectRight))
  const closestY = Math.max(rectBottom, Math.min(point.y, rectTop))

  const distanceX = point.x - closestX
  const distanceY = point.y - closestY

  return distanceX * distanceX + distanceY * distanceY <= radius * radius
}

function generateTabsForEdge({
  board,
  edge,
  otherBoards,
  options,
}: {
  board: PcbBoard
  edge: "top" | "bottom" | "left" | "right"
  otherBoards: PcbBoard[]
  options: PanelOptions
}): TabCutout[] {
  const tabs: TabCutout[] = []

  if (!board.width || !board.height) return tabs

  const boardLeft = board.center.x - board.width / 2
  const boardRight = board.center.x + board.width / 2
  const boardBottom = board.center.y - board.height / 2
  const boardTop = board.center.y + board.height / 2

  let edgeLength: number
  let isHorizontal: boolean
  let edgeCenter: number

  if (edge === "top" || edge === "bottom") {
    edgeLength = board.width
    isHorizontal = true
    edgeCenter = edge === "top" ? boardTop : boardBottom
  } else {
    edgeLength = board.height
    isHorizontal = false
    edgeCenter = edge === "right" ? boardRight : boardLeft
  }

  const totalTabWidth = options.tabLength
  let fixedSpacing = options.boardGap
  if (options.mouseBites) {
    const mouseBiteDiameter = options.tabWidth * 0.45
    const mouseBiteSpacing = mouseBiteDiameter * 0.1
    // Ensure at least 2 mouse bites per gap
    const mouseBitesPerGap = Math.max(2, Math.ceil(options.tabLength / 2))

    // the spacing between tabs should depend on all mouse bite data
    const minSpacingForMouseBites =
      mouseBitesPerGap * mouseBiteDiameter +
      (mouseBitesPerGap - 1) * mouseBiteSpacing
    fixedSpacing = minSpacingForMouseBites * 1.1
  }

  let numTabs = Math.floor(
    (edgeLength - fixedSpacing) / (totalTabWidth + fixedSpacing),
  )

  if (numTabs < 1 && edgeLength >= totalTabWidth) {
    numTabs = 1
  }

  if (numTabs === 0) return tabs

  const actualSpacing = fixedSpacing

  const boardStart = -edgeLength / 2
  const boardEnd = edgeLength / 2

  for (let i = 0; i < numTabs; i++) {
    const offsetAlongEdge =
      boardStart +
      actualSpacing +
      i * (totalTabWidth + actualSpacing) +
      totalTabWidth / 2

    const isFirstTab = i === 0
    const isLastTab = i === numTabs - 1
    const isCornerTab = isFirstTab || isLastTab

    let axisStart = offsetAlongEdge - totalTabWidth / 2
    let axisEnd = offsetAlongEdge + totalTabWidth / 2

    if (isCornerTab) {
      if (isFirstTab) axisStart = boardStart
      if (isLastTab) axisEnd = boardEnd
    }

    axisStart = Math.max(axisStart, boardStart)
    axisEnd = Math.min(axisEnd, boardEnd)

    if (isCornerTab) {
      if (isFirstTab) axisStart -= options.tabWidth
      if (isLastTab) axisEnd += options.tabWidth
    }

    if (axisEnd <= axisStart) continue

    const axisCenterOffset = (axisStart + axisEnd) / 2
    const axisLength = axisEnd - axisStart
    const crossAxisOffset =
      edge === "top" || edge === "right"
        ? options.tabWidth / 2
        : -options.tabWidth / 2

    const tabCenter = isHorizontal
      ? {
          x: board.center.x + axisCenterOffset,
          y: edgeCenter + crossAxisOffset,
        }
      : {
          x: edgeCenter + crossAxisOffset,
          y: board.center.y + axisCenterOffset,
        }

    const tabWidth = isHorizontal ? axisLength : options.tabWidth
    const tabHeight = isHorizontal ? options.tabWidth : axisLength

    const newTab: TabCutout = {
      center: tabCenter,
      width: tabWidth,
      height: tabHeight,
      boardId: `${board.center.x}_${board.center.y}`,
    }

    let overlapsBoard = false
    for (const otherBoard of otherBoards) {
      if (!otherBoard.width || !otherBoard.height) continue

      const boardRect = {
        center: otherBoard.center,
        width: otherBoard.width,
        height: otherBoard.height,
      }
      if (rectanglesOverlap(newTab, boardRect)) {
        overlapsBoard = true
        break
      }
    }

    if (overlapsBoard && !isCornerTab) continue

    tabs.push(newTab)
  }

  return tabs
}

function generateMouseBitesForEdge({
  board,
  edge,
  edgeTabs,
  allBoards,
  options,
}: {
  board: PcbBoard
  edge: "top" | "bottom" | "left" | "right"
  edgeTabs: TabCutout[]
  allBoards: PcbBoard[]
  options: PanelOptions
}): MouseBite[] {
  const mouseBites: MouseBite[] = []

  if (edgeTabs.length === 0) return mouseBites

  if (!board.width || !board.height) return mouseBites

  const boardLeft = board.center.x - board.width / 2
  const boardRight = board.center.x + board.width / 2
  const boardBottom = board.center.y - board.height / 2
  const boardTop = board.center.y + board.height / 2

  const isHorizontal = edge === "top" || edge === "bottom"

  // mouse bite diameter should depend on the tab size
  const mouseBiteDiameter = options.tabWidth * 0.45
  // the mouse bite spacing should depend on its diameter
  const mouseBiteSpacing = mouseBiteDiameter * 0.1
  // the mouse bites per gap should depend on the tab length only, with a min of 2
  const mouseBitesPerGap = Math.max(2, Math.ceil(options.tabLength / 2))

  let mouseBitePosition: number

  const radius = mouseBiteDiameter / 2

  if (edge === "top") {
    mouseBitePosition = boardTop
  } else if (edge === "bottom") {
    mouseBitePosition = boardBottom
  } else if (edge === "right") {
    mouseBitePosition = boardRight
  } else {
    mouseBitePosition = boardLeft
  }

  const sortedTabs = [...edgeTabs].sort((a, b) => {
    if (isHorizontal) {
      return a.center.x - b.center.x
    } else {
      return a.center.y - b.center.y
    }
  })

  for (let i = 0; i < sortedTabs.length - 1; i++) {
    const tab1 = sortedTabs[i]
    const tab2 = sortedTabs[i + 1]

    let gapStart: number
    let gapEnd: number

    if (isHorizontal) {
      gapStart = tab1.center.x + tab1.width / 2
      gapEnd = tab2.center.x - tab2.width / 2
    } else {
      gapStart = tab1.center.y + tab1.height / 2
      gapEnd = tab2.center.y - tab2.height / 2
    }

    const gapLength = gapEnd - gapStart

    const totalMouseBiteWidth = mouseBitesPerGap * mouseBiteDiameter
    const totalSpacing = (mouseBitesPerGap - 1) * mouseBiteSpacing

    if (gapLength < totalMouseBiteWidth + totalSpacing) continue

    const gapCenter = (gapStart + gapEnd) / 2

    for (let j = 0; j < mouseBitesPerGap; j++) {
      const posOffset =
        (j - (mouseBitesPerGap - 1) / 2) *
        (mouseBiteDiameter + mouseBiteSpacing)

      const newMouseBite: MouseBite = isHorizontal
        ? { x: gapCenter + posOffset, y: mouseBitePosition }
        : { x: mouseBitePosition, y: gapCenter + posOffset }

      const radius = mouseBiteDiameter / 2
      let overlapsBoard = false
      for (const otherBoard of allBoards) {
        if (!otherBoard.width || !otherBoard.height) continue
        const boardRect = {
          center: otherBoard.center,
          width: otherBoard.width,
          height: otherBoard.height,
        }
        if (pointOverlapsRectangle(newMouseBite, radius, boardRect)) {
          overlapsBoard = true
          break
        }
      }
      if (overlapsBoard) continue

      mouseBites.push(newMouseBite)
    }
  }

  return mouseBites
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

  for (let boardIndex = 0; boardIndex < boards.length; boardIndex++) {
    const board = boards[boardIndex]!
    const otherBoards = boards.filter((_, i) => i !== boardIndex)

    if (board.outline && board.outline.length > 0) {
      const mouseBiteDiameter = options.tabWidth * 0.45
      const mouseBiteSpacing = mouseBiteDiameter * 0.1
      const generated = generatePanelTabsAndMouseBitesForOutlines(
        board.outline,
        otherBoards,
        {
          ...options,
          mouseBiteHoleDiameter: mouseBiteDiameter,
          mouseBiteHoleSpacing: mouseBiteSpacing,
        },
      )

      finalTabCutouts.push(...generated.tabCutouts)
      allMouseBites.push(...generated.mouseBiteHoles)
    } else {
      for (const edge of ["top", "bottom", "left", "right"] as const) {
        const edgeTabs = generateTabsForEdge({
          board,
          edge,
          otherBoards,
          options,
        })

        for (const tab of edgeTabs) {
          const tabWidthDimension = Math.min(tab.width, tab.height)
          finalTabCutouts.push({
            type: "pcb_cutout",
            shape: "rect",
            center: tab.center,
            width: tab.width,
            height: tab.height,
            corner_radius: tabWidthDimension / 2,
          } as PcbCutoutRect)
        }

        if (options.mouseBites) {
          const edgeMouseBites = generateMouseBitesForEdge({
            board,
            edge,
            edgeTabs,
            allBoards: otherBoards,
            options,
          })
          allMouseBites.push(...edgeMouseBites)
        }
      }
    }
  }

  const tabCutouts: PcbCutout[] = finalTabCutouts.map((tab, index) => ({
    ...tab,
    pcb_cutout_id: `panel_tab_${index}`,
  }))

  const mouseBiteDiameter = options.tabWidth * 0.45
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
