import { subpanelProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import { DEFAULT_TAB_WIDTH } from "../../utils/panels/generate-panel-tabs-and-mouse-bites"
import { packBoardsIntoGrid } from "../../utils/panels/pack-boards-into-grid"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Group } from "../primitive-components/Group/Group"
import { Board } from "./Board"
import type { Matrix } from "transformation-matrix"
import { compose, translate } from "transformation-matrix"

export class Subpanel extends Group<typeof subpanelProps> {
  _cachedGridWidth = 0
  _cachedGridHeight = 0

  get config() {
    return {
      componentName: "Subpanel",
      zodProps: subpanelProps,
    }
  }

  get isGroup() {
    return true
  }

  get isSubcircuit() {
    return false
  }

  add(component: PrimitiveComponent) {
    if (
      component.lowercaseComponentName !== "board" &&
      component.lowercaseComponentName !== "subpanel"
    ) {
      throw new Error(
        "<subpanel> can only contain <board> or <subpanel> elements",
      )
    }
    super.add(component)
  }

  runRenderCycle() {
    // Validate that subpanel is inside a panel
    const parentPanel = this._findParentPanel()
    if (!parentPanel) {
      throw new Error("<subpanel> must be inside a <panel>")
    }

    // Validate that subpanel contains at least one board
    if (!this.children.some((child) => child.componentName === "Board")) {
      throw new Error("<subpanel> must contain at least one <board>")
    }

    super.runRenderCycle()
  }

  _findParentPanel(): PrimitiveComponent | null {
    let current: PrimitiveComponent | null = this.parent
    while (current) {
      if (current.lowercaseComponentName === "panel") {
        return current
      }
      current = current.parent
    }
    return null
  }

  override _computePcbGlobalTransformBeforeLayout(): Matrix {
    const parentTransform =
      this.parent?._computePcbGlobalTransformBeforeLayout?.() ??
      ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } as Matrix)

    const pcbX = this._parsedProps.pcbX
      ? distance.parse(this._parsedProps.pcbX)
      : 0
    const pcbY = this._parsedProps.pcbY
      ? distance.parse(this._parsedProps.pcbY)
      : 0

    return compose(parentTransform, translate(pcbX, pcbY))
  }

  doInitialPanelBoardLayout() {
    if (this.root?.pcbDisabled) return

    const layoutMode = this._parsedProps.layoutMode ?? "none"

    const childBoardInstances = this.children.filter(
      (c) => c instanceof Board,
    ) as Board[]

    // Warn if boards have manual positioning when subpanel layout is automatic
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
            message: `Board has manual positioning (${propertyNames}) but subpanel layout mode is "${layoutMode}". Manual positioning will be ignored.`,
            error_type: "source_property_ignored_warning",
          })
        }
      }
    }

    // Error if multiple boards without pcbX/pcbY when layoutMode is "none"
    if (layoutMode === "none" && childBoardInstances.length > 1) {
      const boardsWithoutPosition = childBoardInstances.filter((board) => {
        const hasPcbX = board._parsedProps.pcbX !== undefined
        const hasPcbY = board._parsedProps.pcbY !== undefined
        return !hasPcbX && !hasPcbY
      })

      if (boardsWithoutPosition.length > 1) {
        this.root!.db.pcb_placement_error.insert({
          error_type: "pcb_placement_error",
          message: `Multiple boards in subpanel without pcbX/pcbY positions. When layoutMode="none", each board must have explicit pcbX and pcbY coordinates to avoid overlapping. Either set pcbX/pcbY on each board, or use layoutMode="grid" for automatic positioning.`,
        })
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

    // Set panel position offset on each board (relative to subpanel center)
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
    } else {
      // layoutMode is "none" - use explicit positions
      const subpanelGlobalPos = this._getGlobalPcbPositionBeforeLayout()
      for (const board of childBoardInstances) {
        const boardDb = db.pcb_board.get(board.pcb_board_id!)
        if (!boardDb) continue
        const relativeX = boardDb.center.x - subpanelGlobalPos.x
        const relativeY = boardDb.center.y - subpanelGlobalPos.y
        db.pcb_board.update(board.pcb_board_id!, {
          position_mode: "relative_to_panel_anchor",
          display_offset_x: `${relativeX}mm`,
          display_offset_y: `${relativeY}mm`,
        })
      }
    }
  }

  // Override to not create pcb_panel (subpanel is just a logical grouping)
  doInitialPcbComponentRender() {
    // Don't create a pcb_panel record - subpanel is just for grouping
    // Still call parent to set up pcb_group
    super.doInitialPcbComponentRender()
  }
}
