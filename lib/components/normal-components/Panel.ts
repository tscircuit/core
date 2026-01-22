import { panelProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import {
  DEFAULT_TAB_LENGTH,
  DEFAULT_TAB_WIDTH,
  generatePanelTabsAndMouseBites,
} from "../../utils/panels/generate-panel-tabs-and-mouse-bites"
import { packBoardsIntoGrid } from "../../utils/panels/pack-boards-into-grid"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Group } from "../primitive-components/Group/Group"
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

  _cachedGridWidth = 0
  _cachedGridHeight = 0
  doInitialPanelBoardLayout() {
    if (this.root?.pcbDisabled) return

    const layoutMode = this._parsedProps.layoutMode ?? "none"

    const childBoardInstances = this.children.filter(
      (c) => c instanceof Board,
    ) as Board[]

    // Warn if boards have manual positioning when panel layout is automatic
    if (layoutMode !== "none") {
      for (const board of childBoardInstances) {
        const hasPcbX = board._parsedProps.pcbX !== undefined
        const hasPcbY = board._parsedProps.pcbY !== undefined
        if (hasPcbX || hasPcbY) {
          const properties = []
          if (hasPcbX) properties.push("pcbX")
          if (hasPcbY) properties.push("pcbY")
          const propertyNames = properties.join(" and ")

          this.root!.db.source_property_ignored_warning.insert({
            source_component_id: board.source_component_id!,
            property_name: propertyNames,
            message: `Board has manual positioning (${propertyNames}) but panel layout mode is "${layoutMode}". Manual positioning will be ignored.`,
            error_type: "source_property_ignored_warning",
          })
        }
      }
    }

    if (layoutMode !== "grid") return

    const tabWidth = this._parsedProps.tabWidth ?? DEFAULT_TAB_WIDTH
    const boardGap = this._parsedProps.boardGap ?? tabWidth

    const { positions, gridWidth, gridHeight } = packBoardsIntoGrid({
      boards: childBoardInstances,
      row: this._parsedProps.row,
      col: this._parsedProps.col,
      cellWidth: this._parsedProps.cellWidth,
      cellHeight: this._parsedProps.cellHeight,
      boardGap,
    })

    this._cachedGridWidth = gridWidth
    this._cachedGridHeight = gridHeight

    // Set panel position offset on each board (relative to panel center)
    for (const { board, pos } of positions) {
      board._panelPositionOffset = pos
    }
  }

  doInitialPanelLayout() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!

    const childBoardInstances = this.children.filter(
      (c) => c instanceof Board,
    ) as Board[]

    const layoutMode = this._parsedProps.layoutMode ?? "none"

    if (layoutMode === "grid") {
      // Update display offsets for boards (positions are already correct)
      for (const board of childBoardInstances) {
        if (!board.pcb_board_id || !board._panelPositionOffset) continue
        db.pcb_board.update(board.pcb_board_id, {
          position_mode: "relative_to_panel_anchor",
          display_offset_x: `${board._panelPositionOffset.x}mm`,
          display_offset_y: `${board._panelPositionOffset.y}mm`,
        })
      }

      // Update panel dimensions
      const hasExplicitWidth = this._parsedProps.width !== undefined
      const hasExplicitHeight = this._parsedProps.height !== undefined
      const gridWidth = this._cachedGridWidth
      const gridHeight = this._cachedGridHeight

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
      // layoutMode is "none" or "pack" - use explicit positions
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
    // Panel does not create a PCB group, only a PCB panel
    // super.doInitialPcbComponentRender() // Skip this to avoid creating PCB group
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
