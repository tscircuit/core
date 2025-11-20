import type { PcbBoard, PcbCutoutRect, PcbHoleCircle } from "circuit-json"

export const TAB_CONFIG = {
  TAB_WIDTH: 4,
  TAB_DEPTH: 0.5,
  TAB_TO_SPACE_RATIO: 5,
  MOUSE_BITE_DIAMETER: 0.2,
  MOUSE_BITE_SPACING: 0.1,
  MOUSE_BITES_PER_GAP: 5,
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

function generateTabsForEdge(
  board: PcbBoard,
  edge: "top" | "bottom" | "left" | "right",
  existingTabs: TabCutout[],
  otherBoards: PcbBoard[],
): TabCutout[] {
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

  const totalTabWidth = TAB_CONFIG.TAB_WIDTH
  const minSpacingForMouseBites =
    TAB_CONFIG.MOUSE_BITES_PER_GAP * TAB_CONFIG.MOUSE_BITE_DIAMETER +
    (TAB_CONFIG.MOUSE_BITES_PER_GAP - 1) * TAB_CONFIG.MOUSE_BITE_SPACING

  const fixedSpacing = minSpacingForMouseBites * 1.1

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
      if (isFirstTab) axisStart -= TAB_CONFIG.TAB_DEPTH
      if (isLastTab) axisEnd += TAB_CONFIG.TAB_DEPTH
    }

    if (axisEnd <= axisStart) continue

    const axisCenterOffset = (axisStart + axisEnd) / 2
    const axisLength = axisEnd - axisStart
    const crossAxisOffset =
      edge === "top" || edge === "right"
        ? TAB_CONFIG.TAB_DEPTH / 2
        : -TAB_CONFIG.TAB_DEPTH / 2

    const tabCenter = isHorizontal
      ? {
          x: board.center.x + axisCenterOffset,
          y: edgeCenter + crossAxisOffset,
        }
      : {
          x: edgeCenter + crossAxisOffset,
          y: board.center.y + axisCenterOffset,
        }

    const tabWidth = isHorizontal ? axisLength : TAB_CONFIG.TAB_DEPTH
    const tabHeight = isHorizontal ? TAB_CONFIG.TAB_DEPTH : axisLength

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

function generateMouseBitesForEdge(
  board: PcbBoard,
  edge: "top" | "bottom" | "left" | "right",
  edgeTabs: TabCutout[],
  allTabs: TabCutout[],
  allBoards: PcbBoard[],
  existingMouseBites: MouseBite[],
): MouseBite[] {
  const mouseBites: MouseBite[] = []

  if (edgeTabs.length === 0) return mouseBites

  if (!board.width || !board.height) return mouseBites

  const boardLeft = board.center.x - board.width / 2
  const boardRight = board.center.x + board.width / 2
  const boardBottom = board.center.y - board.height / 2
  const boardTop = board.center.y + board.height / 2

  const isHorizontal = edge === "top" || edge === "bottom"

  let mouseBitePosition: number

  const radius = TAB_CONFIG.MOUSE_BITE_DIAMETER / 2

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

    const totalMouseBiteWidth =
      TAB_CONFIG.MOUSE_BITES_PER_GAP * TAB_CONFIG.MOUSE_BITE_DIAMETER
    const totalSpacing =
      (TAB_CONFIG.MOUSE_BITES_PER_GAP - 1) * TAB_CONFIG.MOUSE_BITE_SPACING

    if (gapLength < totalMouseBiteWidth + totalSpacing) continue

    const gapCenter = (gapStart + gapEnd) / 2

    for (let j = 0; j < TAB_CONFIG.MOUSE_BITES_PER_GAP; j++) {
      const posOffset =
        (j - (TAB_CONFIG.MOUSE_BITES_PER_GAP - 1) / 2) *
        (TAB_CONFIG.MOUSE_BITE_DIAMETER + TAB_CONFIG.MOUSE_BITE_SPACING)

      const newMouseBite: MouseBite = isHorizontal
        ? { x: gapCenter + posOffset, y: mouseBitePosition }
        : { x: mouseBitePosition, y: gapCenter + posOffset }

      const radius = TAB_CONFIG.MOUSE_BITE_DIAMETER / 2
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

export function generatePanelTabsAndMouseBites(boards: PcbBoard[]): {
  tabCutouts: PcbCutoutRect[]
  mouseBiteHoles: PcbHoleCircle[]
} {
  const allTabCutouts: TabCutout[] = []
  const allMouseBites: MouseBite[] = []

  for (let boardIndex = 0; boardIndex < boards.length; boardIndex++) {
    const board = boards[boardIndex]
    const otherBoards = boards.filter((_, i) => i !== boardIndex)

    for (const edge of ["top", "bottom", "left", "right"] as const) {
      const edgeTabs = generateTabsForEdge(
        board,
        edge,
        allTabCutouts,
        otherBoards,
      )
      allTabCutouts.push(...edgeTabs)

      const edgeMouseBites = generateMouseBitesForEdge(
        board,
        edge,
        edgeTabs,
        allTabCutouts,
        otherBoards,
        allMouseBites,
      )
      allMouseBites.push(...edgeMouseBites)
    }
  }

  const tabCutouts: PcbCutoutRect[] = allTabCutouts.map((tab, index) => ({
    type: "pcb_cutout",
    pcb_cutout_id: `panel_tab_${index}`,
    shape: "rect",
    center: tab.center,
    width: tab.width,
    height: tab.height,
    corner_radius: 0.25,
  }))

  const mouseBiteHoles: PcbHoleCircle[] = allMouseBites.map((bite, index) => ({
    type: "pcb_hole",
    pcb_hole_id: `panel_mouse_bite_${index}`,
    hole_shape: "circle",
    hole_diameter: TAB_CONFIG.MOUSE_BITE_DIAMETER,
    x: bite.x,
    y: bite.y,
  }))

  return {
    tabCutouts,
    mouseBiteHoles,
  }
}
