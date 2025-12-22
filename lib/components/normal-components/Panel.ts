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
import { packBoardsIntoGrid } from "../../utils/panels/pack-boards-into-grid"

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

  doInitialPanelLayout() {
    if (this.root?.pcbDisabled) return
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

      const { positions, gridWidth, gridHeight } = packBoardsIntoGrid({
        boards: unpositionedBoards,
        db,
        row: this._parsedProps.row,
        col: this._parsedProps.col,
        cellWidth: this._parsedProps.cellWidth,
        cellHeight: this._parsedProps.cellHeight,
        boardGap,
      })

      // Get panel's global position to compute absolute board positions
      const panelGlobalPos = this._getGlobalPcbPositionBeforeLayout()

      for (const { board, pos } of positions) {
        const absoluteX = panelGlobalPos.x + pos.x
        const absoluteY = panelGlobalPos.y + pos.y
        board._repositionOnPcb({ x: absoluteX, y: absoluteY })
        db.pcb_board.update(board.pcb_board_id!, {
          center: { x: absoluteX, y: absoluteY },
          position_mode: "relative_to_panel_anchor",
          display_offset_x: `${pos.x}mm`,
          display_offset_y: `${pos.y}mm`,
        })
      }

      // Skip auto-calculation if both dimensions are explicitly provided
      const hasExplicitWidth = this._parsedProps.width !== undefined
      const hasExplicitHeight = this._parsedProps.height !== undefined

      if (hasExplicitWidth && hasExplicitHeight) {
        db.pcb_panel.update(this.pcb_panel_id!, {
          width: distance.parse(this._parsedProps.width),
          height: distance.parse(this._parsedProps.height),
        })
      } else if (gridWidth > 0 || gridHeight > 0) {
        const {
          edgePadding: edgePaddingProp,
          edgePaddingLeft: edgePaddingLeftProp,
          edgePaddingRight: edgePaddingRightProp,
          edgePaddingTop: edgePaddingTopProp,
          edgePaddingBottom: edgePaddingBottomProp,
        } = this._parsedProps

        const edgePadding = distance.parse(edgePaddingProp ?? 5)
        const edgePaddingLeft = distance.parse(
          edgePaddingLeftProp ?? edgePadding,
        )
        const edgePaddingRight = distance.parse(
          edgePaddingRightProp ?? edgePadding,
        )
        const edgePaddingTop = distance.parse(edgePaddingTopProp ?? edgePadding)
        const edgePaddingBottom = distance.parse(
          edgePaddingBottomProp ?? edgePadding,
        )

        db.pcb_panel.update(this.pcb_panel_id!, {
          width: hasExplicitWidth
            ? distance.parse(this._parsedProps.width)
            : gridWidth + edgePaddingLeft + edgePaddingRight,
          height: hasExplicitHeight
            ? distance.parse(this._parsedProps.height)
            : gridHeight + edgePaddingTop + edgePaddingBottom,
        })
      }
    } else {
      const panelGlobalPos = this._getGlobalPcbPositionBeforeLayout()
      for (const board of childBoardInstances) {
        const boardDb = db.pcb_board.get(board.pcb_board_id!)
        if (!boardDb) continue
        const relativeX = boardDb.center.x - panelGlobalPos.x
        const relativeY = boardDb.center.y - panelGlobalPos.y
        db.pcb_board.update(board.pcb_board_id!, {
          position_mode: "relative_to_panel_anchor",
          display_offset_x: `${relativeX}mm`,
          display_offset_y: `${relativeY}mm`,
        })
      }
    }

    if (this._tabsAndMouseBitesGenerated) return

    const props = this._parsedProps
    const panelizationMethod = props.panelizationMethod ?? "none"

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

    // Use 0 as placeholder when dimensions are not provided - will be auto-calculated in doInitialPanelLayout
    const inserted = db.pcb_panel.insert({
      width: props.width !== undefined ? distance.parse(props.width) : 0,
      height: props.height !== undefined ? distance.parse(props.height) : 0,
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
    const currentPanel = db.pcb_panel.get(this.pcb_panel_id)

    // Only update dimensions if explicitly provided, otherwise keep current (auto-calculated) values
    db.pcb_panel.update(this.pcb_panel_id, {
      width:
        props.width !== undefined
          ? distance.parse(props.width)
          : currentPanel?.width,
      height:
        props.height !== undefined
          ? distance.parse(props.height)
          : currentPanel?.height,
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
