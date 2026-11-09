import type {
  PanelTabEdge,
  panelTabKeepoutProps,
  panelTabProps,
} from "@tscircuit/props"
import type {
  PcbBoard,
  PcbCutoutRect,
  PcbHoleCircle,
  Point,
} from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type { z } from "zod"
import {
  getMouseBiteSize,
  getScaledPanelTabSize,
} from "./generate-panel-tabs-and-mouse-bites"
import { getRectangularPanelBoardBounds } from "./get-rectangular-panel-board-bounds"

type ParsedPanelTab = z.output<typeof panelTabProps>
type ParsedPanelTabKeepout = z.output<typeof panelTabKeepoutProps>

interface NamedPanelBoard {
  board: PcbBoard
  boardName: string
}

interface PanelTabInterval {
  start: number
  end: number
  centre: number
}

/** Generate tab cutouts and drill centres in circuit-world millimetres (+X right,
 * +Y up). Edge offsets are distances along a rectangular board edge; point
 * transforms into world space include translation and counterclockwise rotation.
 */
export function generateControlledPanelTabs(
  boards: NamedPanelBoard[],
  options: {
    tabs?: ParsedPanelTab[]
    tabCountPerEdge?: number
    tabKeepouts?: ParsedPanelTabKeepout[]
    tabLength: number
    tabWidth: number
    mouseBites: boolean
  },
) {
  const tabCutouts: PcbCutoutRect[] = []
  const mouseBiteHoles: PcbHoleCircle[] = []
  const dimensions = boards.map(({ board }) =>
    getRectangularPanelBoardBounds(board),
  )
  const minimumBoardDimension = Math.min(
    ...dimensions.flatMap((bounds) => [
      bounds.maxX - bounds.minX,
      bounds.maxY - bounds.minY,
    ]),
  )
  const { tabWidth, tabLength } = getScaledPanelTabSize({
    minimumBoardDimension,
    tabWidth: options.tabWidth,
    tabLength: options.tabLength,
  })
  const mouseBiteSize = getMouseBiteSize({ tabWidth })
  const drillDiameter = mouseBiteSize.diameter
  const drillPitch = mouseBiteSize.diameter + mouseBiteSize.spacing
  for (const control of [
    ...(options.tabs ?? []),
    ...(options.tabKeepouts ?? []),
  ]) {
    if (
      control.boardName &&
      !boards.some(({ boardName }) => boardName === control.boardName)
    )
      throw new Error(`Unknown board name "${control.boardName}" in panel tabs`)
  }

  for (const { board, boardName } of boards) {
    const bounds = getRectangularPanelBoardBounds(board)
    const edges: {
      side: PanelTabEdge
      origin: Point
      length: number
      ccwRotationDegrees: number
      outwardSign: number
    }[] = [
      {
        side: "top",
        origin: { x: bounds.minX, y: bounds.maxY },
        length: bounds.maxX - bounds.minX,
        ccwRotationDegrees: 0,
        outwardSign: 1,
      },
      {
        side: "bottom",
        origin: { x: bounds.minX, y: bounds.minY },
        length: bounds.maxX - bounds.minX,
        ccwRotationDegrees: 0,
        outwardSign: -1,
      },
      {
        side: "left",
        origin: { x: bounds.minX, y: bounds.minY },
        length: bounds.maxY - bounds.minY,
        ccwRotationDegrees: 90,
        outwardSign: 1,
      },
      {
        side: "right",
        origin: { x: bounds.maxX, y: bounds.minY },
        length: bounds.maxY - bounds.minY,
        ccwRotationDegrees: 90,
        outwardSign: -1,
      },
    ]
    let boardTabCount = 0
    for (const edge of edges) {
      const explicitTabs = options.tabs
      const tabCentres =
        explicitTabs === undefined
          ? Array.from(
              { length: options.tabCountPerEdge ?? 1 },
              (_, tabIndex) =>
                ((tabIndex + 1) * edge.length) /
                ((options.tabCountPerEdge ?? 1) + 1),
            )
          : explicitTabs
              .filter(
                (tab) =>
                  tab.boardEdge === edge.side &&
                  (!tab.boardName || tab.boardName === boardName),
              )
              .map((tab) => tab.offset)
      const keepouts =
        options.tabKeepouts?.filter(
          (keepout) =>
            keepout.boardEdge === edge.side &&
            (!keepout.boardName || keepout.boardName === boardName),
        ) ?? []
      const intervals: PanelTabInterval[] = []
      for (const centre of tabCentres.sort(
        (firstCentreMm, secondCentreMm) => firstCentreMm - secondCentreMm,
      )) {
        const start = centre - tabLength / 2
        const end = centre + tabLength / 2
        if (start < 0 || end > edge.length)
          throw new Error(
            `A ${edge.side} tab on ${boardName} extends beyond the board edge. Reduce tabLength or move the tab.`,
          )
        if (
          keepouts.some((keepout) => end >= keepout.from && start <= keepout.to)
        ) {
          if (explicitTabs)
            throw new Error(
              `An explicit ${edge.side} tab on ${boardName} overlaps a tab keepout`,
            )
          continue
        }
        if (intervals.at(-1) && start < intervals.at(-1)!.end)
          throw new Error(
            `The ${edge.side} tabs on ${boardName} overlap. Reduce their count or tabLength.`,
          )
        const previousTab = intervals.at(-1)
        if (previousTab && start - previousTab.end < tabWidth - 1e-9)
          throw new Error(
            `The ${edge.side} tabs on ${boardName} leave insufficient router clearance. Reduce their count, tabLength, or tabWidth.`,
          )
        intervals.push({ start, end, centre })
      }
      boardTabCount += intervals.length
      const edgeToWorldTransform = compose(
        translate(edge.origin.x, edge.origin.y),
        rotateDEG(edge.ccwRotationDegrees),
      )
      let routeStart = -tabWidth
      for (const interval of [
        ...intervals,
        {
          start: edge.length + tabWidth,
          end: edge.length + tabWidth,
          centre: edge.length,
        },
      ]) {
        const routeLength = interval.start - routeStart
        if (routeLength > 1e-9) {
          tabCutouts.push({
            pcb_cutout_id: `pcb_cutout_panel_tab_${board.pcb_board_id}_${tabCutouts.length}`,
            type: "pcb_cutout",
            shape: "rect",
            center: applyToPoint(edgeToWorldTransform, {
              x: routeStart + routeLength / 2,
              y: (edge.outwardSign * tabWidth) / 2,
            }),
            width: routeLength,
            height: tabWidth,
            rotation: edge.ccwRotationDegrees,
            corner_radius: Math.min(routeLength, tabWidth) / 2,
          })
        }
        routeStart = interval.end
      }
      if (
        options.mouseBites &&
        drillDiameter > 0 &&
        tabLength >= drillDiameter
      ) {
        const holeCount =
          Math.floor((tabLength - drillDiameter) / drillPitch) + 1
        for (const interval of intervals) {
          for (let holeIndex = 0; holeIndex < holeCount; holeIndex++) {
            const position = applyToPoint(edgeToWorldTransform, {
              x:
                interval.centre +
                (holeIndex - (holeCount - 1) / 2) * drillPitch,
              y: 0,
            })
            mouseBiteHoles.push({
              pcb_hole_id: `pcb_hole_panel_mouse_bite_${board.pcb_board_id}_${mouseBiteHoles.length}`,
              type: "pcb_hole",
              hole_shape: "circle",
              hole_diameter: drillDiameter,
              ...position,
            })
          }
        }
      }
    }
    if (boardTabCount === 0)
      throw new Error(
        `${boardName} has no panel tabs and would be cut free of the panel. Add a <paneltab> for it or narrow its <paneltabkeepout>.`,
      )
  }
  return { tabCutouts, mouseBiteHoles }
}
