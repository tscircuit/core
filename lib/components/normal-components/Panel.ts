import { panelProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Group } from "../primitive-components/Group/Group"
import {
  generatePanelTabsAndMouseBites,
  DEFAULT_TAB_LENGTH,
  DEFAULT_TAB_WIDTH,
} from "../../utils/panels/generate-panel-tabs-and-mouse-bites"
import { Board } from "./Board"

export class Panel extends Group<typeof panelProps> {
  pcb_panel_id: string | null = null
  _tabsAndMouseBitesGenerated = false

  get config() {
    return {
      componentName: "Panel",
      zodProps: panelProps,
    }
  }

  get isGroup() {
    return true
  }

  get isSubcircuit() {
    return true
  }

  add(component: PrimitiveComponent) {
    if (component.lowercaseComponentName !== "board") {
      throw new Error("<panel> can only contain <board> elements")
    }
    super.add(component)
  }

  doInitialPcbComponentAnchorAlignment() {
    if (this.root?.pcbDisabled) return
    super.doInitialPcbComponentAnchorAlignment()
    const { db } = this.root!

    const childBoardInstances = this.children.filter(
      (c) => c instanceof Board,
    ) as Board[]

    const hasAnyPositionedBoards = childBoardInstances.some(
      (b) => b.props.pcbX !== undefined || b.props.pcbY !== undefined,
    )

    const unpositionedBoards = childBoardInstances.filter(
      (b) => b.props.pcbX === undefined && b.props.pcbY === undefined,
    )

    if (unpositionedBoards.length > 0 && !hasAnyPositionedBoards) {
      const tabWidth = this._parsedProps.tabWidth ?? DEFAULT_TAB_WIDTH
      const boardGap = this._parsedProps.boardGap ?? tabWidth
      const gridCols = Math.ceil(Math.sqrt(unpositionedBoards.length))
      const gridRows = Math.ceil(unpositionedBoards.length / gridCols)

      const colWidths: number[] = Array(gridCols).fill(0)
      const rowHeights: number[] = Array(gridRows).fill(0)

      unpositionedBoards.forEach((board, i) => {
        const col = i % gridCols
        const row = Math.floor(i / gridCols)

        const pcbBoard = db.pcb_board.get(board.pcb_board_id!)
        if (
          !pcbBoard ||
          pcbBoard.width === undefined ||
          pcbBoard.height === undefined
        )
          return

        colWidths[col] = Math.max(colWidths[col], pcbBoard.width)
        rowHeights[row] = Math.max(rowHeights[row], pcbBoard.height)
      })

      const totalGridWidth =
        colWidths.reduce((a, b) => a + b, 0) +
        (gridCols > 1 ? (gridCols - 1) * boardGap : 0)
      const totalGridHeight =
        rowHeights.reduce((a, b) => a + b, 0) +
        (gridRows > 1 ? (gridRows - 1) * boardGap : 0)

      const startX = -totalGridWidth / 2
      const startY = -totalGridHeight / 2

      const rowYOffsets = [startY]
      for (let i = 0; i < gridRows - 1; i++) {
        rowYOffsets.push(rowYOffsets[i] + rowHeights[i] + boardGap)
      }

      const colXOffsets = [startX]
      for (let i = 0; i < gridCols - 1; i++) {
        colXOffsets.push(colXOffsets[i] + colWidths[i] + boardGap)
      }

      unpositionedBoards.forEach((board, i) => {
        const col = i % gridCols
        const row = Math.floor(i / gridCols)

        const pcbBoard = db.pcb_board.get(board.pcb_board_id!)
        if (!pcbBoard || !pcbBoard.width || !pcbBoard.height) return

        const xPos = colXOffsets[col] + colWidths[col] / 2
        const yPos = rowYOffsets[row] + rowHeights[row] / 2

        db.pcb_board.update(board.pcb_board_id!, {
          center: { x: xPos, y: yPos },
        })
      })

      const allBoardPcbIds = childBoardInstances
        .map((b) => b.pcb_board_id)
        .filter((id): id is string => !!id)

      const allBoardsInPanel = db.pcb_board
        .list()
        .filter((b) => allBoardPcbIds.includes(b.pcb_board_id!))

      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      for (const board of allBoardsInPanel) {
        if (
          board.width === undefined ||
          board.height === undefined ||
          !isFinite(board.width) ||
          !isFinite(board.height)
        )
          continue

        const left = board.center.x - board.width / 2
        const right = board.center.x + board.width / 2
        const bottom = board.center.y - board.height / 2
        const top = board.center.y + board.height / 2

        minX = Math.min(minX, left)
        maxX = Math.max(maxX, right)
        minY = Math.min(minY, bottom)
        maxY = Math.max(maxY, top)
      }

      if (isFinite(minX)) {
        const boundsWidth = maxX - minX
        const boundsHeight = maxY - minY
        const margin = 5

        const newPanelWidth = boundsWidth + 2 * margin
        const newPanelHeight = boundsHeight + 2 * margin

        db.pcb_panel.update(this.pcb_panel_id!, {
          width: newPanelWidth,
          height: newPanelHeight,
        })
      }
    }

    if (this._tabsAndMouseBitesGenerated) return

    const props = this._parsedProps
    const panelizationMethod = props.panelizationMethod ?? "tab-routing"

    if (panelizationMethod !== "none") {
      // Get all boards that are children of this panel
      const childBoardIds = childBoardInstances
        .map((c) => c.pcb_board_id)
        .filter((id): id is string => !!id)

      const boardsInPanel = db.pcb_board
        .list()
        .filter((b) => childBoardIds.includes(b.pcb_board_id!))

      if (boardsInPanel.length === 0) return

      const tabWidth = props.tabWidth ?? DEFAULT_TAB_WIDTH
      const boardGap = props.boardGap ?? tabWidth
      // Generate tabs and mouse bites
      const { tabCutouts, mouseBiteHoles } = generatePanelTabsAndMouseBites(
        boardsInPanel,
        {
          boardGap: boardGap,
          tabWidth: tabWidth,
          tabLength: props.tabLength ?? DEFAULT_TAB_LENGTH,
          mouseBites: props.mouseBites ?? true,
        },
      )

      // Insert tab cutouts into the database
      for (const tabCutout of tabCutouts) {
        db.pcb_cutout.insert(tabCutout)
      }

      // Insert mouse bite holes into the database
      for (const mouseBiteHole of mouseBiteHoles) {
        db.pcb_hole.insert(mouseBiteHole)
      }
    }

    this._tabsAndMouseBitesGenerated = true
  }

  runRenderCycle() {
    if (!this.children.some((child) => child.componentName === "Board")) {
      throw new Error("<panel> must contain at least one <board>")
    }

    super.runRenderCycle()
  }

  doInitialPcbComponentRender() {
    super.doInitialPcbComponentRender()
    if (this.root?.pcbDisabled) return

    const { db } = this.root!
    const props = this._parsedProps

    const inserted = db.pcb_panel.insert({
      width: distance.parse(props.width),
      height: distance.parse(props.height),
      center: this._getGlobalPcbPositionBeforeLayout(),
      covered_with_solder_mask: !(props.noSolderMask ?? false),
    })

    this.pcb_panel_id = inserted.pcb_panel_id
  }

  updatePcbComponentRender() {
    if (this.root?.pcbDisabled) return
    if (!this.pcb_panel_id) return

    const { db } = this.root!
    const props = this._parsedProps

    db.pcb_panel.update(this.pcb_panel_id, {
      width: distance.parse(props.width),
      height: distance.parse(props.height),
      center: this._getGlobalPcbPositionBeforeLayout(),
      covered_with_solder_mask: !(props.noSolderMask ?? false),
    })
  }

  removePcbComponentRender() {
    if (!this.pcb_panel_id) return

    this.root?.db.pcb_panel.delete(this.pcb_panel_id)
    this.pcb_panel_id = null
  }
}
