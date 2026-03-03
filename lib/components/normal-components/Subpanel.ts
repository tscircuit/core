import { subpanelProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { compose, identity, translate } from "transformation-matrix"
import {
  DEFAULT_TAB_LENGTH,
  DEFAULT_TAB_WIDTH,
  generatePanelTabsAndMouseBites,
} from "../../utils/panels/generate-panel-tabs-and-mouse-bites"
import { packIntoGrid } from "../../utils/panels/pack-into-grid"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Group } from "../primitive-components/Group/Group"
import { Board } from "./Board"

/**
 * Subpanel is a nested panel that can be placed inside a Panel.
 * It allows organizing boards into groups within a larger panel.
 * - Can be nested inside a Panel (not required to be root-level)
 * - Can contain Board elements
 * - Can contain other Subpanel elements (for nested grouping)
 */
export class Subpanel extends Group<typeof subpanelProps> {
  pcb_panel_id: string | null = null
  _tabsAndMouseBitesGenerated = false

  get config() {
    return {
      componentName: "Subpanel",
      zodProps: subpanelProps,
    }
  }

  protected get _errorComponentName(): string {
    return this.componentName.toLowerCase()
  }

  get isGroup() {
    return true
  }

  get isSubcircuit() {
    return true
  }

  add(component: PrimitiveComponent) {
    // Subpanel can contain boards and other subpanels
    if (
      component.lowercaseComponentName !== "board" &&
      component.lowercaseComponentName !== "subpanel"
    ) {
      throw new Error(
        `<${this._errorComponentName}> can only contain <board> or <subpanel> elements`,
      )
    }
    super.add(component)
  }

  _cachedGridWidth = 0
  _cachedGridHeight = 0
  _panelPositionOffset: { x: number; y: number } | null = null

  override _computePcbGlobalTransformBeforeLayout(): Matrix {
    // If we have a panel-computed offset, incorporate it into the transform
    if (this._panelPositionOffset) {
      // Get parent transform (typically the Panel)
      const parentTransform =
        this.parent?._computePcbGlobalTransformBeforeLayout?.() ?? identity()

      // Compose parent transform with panel offset translation
      // The panel offset is relative to the panel center
      return compose(
        parentTransform,
        translate(this._panelPositionOffset.x, this._panelPositionOffset.y),
      )
    }
    // Otherwise, fall back to the default behavior
    return super._computePcbGlobalTransformBeforeLayout()
  }

  /**
   * Get all board instances from this subpanel and nested subpanels
   */
  _getAllBoardInstances(): Board[] {
    const boards: Board[] = []
    for (const child of this.children) {
      if (child instanceof Board) {
        boards.push(child)
      } else if (child instanceof Subpanel) {
        boards.push(...child._getAllBoardInstances())
      }
    }
    return boards
  }

  /**
   * Check if this subpanel contains at least one board (directly or through nested subpanels)
   */
  _containsBoards(): boolean {
    for (const child of this.children) {
      if (child.componentName === "Board") {
        return true
      }
      if (child.componentName === "Subpanel" && "_containsBoards" in child) {
        if ((child as Subpanel)._containsBoards()) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Get direct board children only (not from nested subpanels)
   */
  _getDirectBoardChildren(): Board[] {
    return this.children.filter((c) => c instanceof Board) as Board[]
  }

  doInitialPanelBoardLayout() {
    if (this.root?.pcbDisabled) return

    const layoutMode = this._parsedProps.layoutMode ?? "none"
    const gridItems = this.children.filter(
      (c) => c instanceof Board || c instanceof Subpanel,
    ) as (Board | Subpanel)[]

    // Warn if boards have manual positioning when panel layout is automatic
    if (layoutMode !== "none") {
      for (const child of gridItems) {
        if (!(child instanceof Board)) continue
        const hasPcbX = child._parsedProps.pcbX !== undefined
        const hasPcbY = child._parsedProps.pcbY !== undefined
        if (hasPcbX || hasPcbY) {
          const propertyNames = [hasPcbX && "pcbX", hasPcbY && "pcbY"]
            .filter(Boolean)
            .join(" and ")
          this.root!.db.source_property_ignored_warning.insert({
            source_component_id: child.source_component_id!,
            property_name: propertyNames,
            message: `Board has manual positioning (${propertyNames}) but ${this._errorComponentName} layout mode is "${layoutMode}". Manual positioning will be ignored.`,
            error_type: "source_property_ignored_warning",
          })
        }
      }
    }

    // Error if multiple items without pcbX/pcbY when layoutMode is "none"
    if (layoutMode === "none" && gridItems.length > 1) {
      const unpositionedItems = gridItems.filter(
        (c) =>
          c._parsedProps.pcbX === undefined &&
          c._parsedProps.pcbY === undefined,
      )
      if (unpositionedItems.length > 1) {
        this.root!.db.pcb_placement_error.insert({
          error_type: "pcb_placement_error",
          message: `Multiple boards/subpanels in ${this._errorComponentName} without pcbX/pcbY positions. When layoutMode="none", each item must have explicit pcbX and pcbY coordinates. Use layoutMode="grid" for automatic positioning.`,
        })
      }
    }

    if (layoutMode !== "grid") return

    const tabWidth = this._parsedProps.tabWidth ?? DEFAULT_TAB_WIDTH
    const boardGap = this._parsedProps.boardGap ?? tabWidth

    // Calculate available space for the grid if panel dimensions are specified
    // but rows/cols are not (auto-calculate optimal grid)
    let availablePanelWidth: number | undefined
    let availablePanelHeight: number | undefined

    const hasExplicitRowOrCol =
      this._parsedProps.row !== undefined || this._parsedProps.col !== undefined
    const hasExplicitWidth = this._parsedProps.width !== undefined
    const hasExplicitHeight = this._parsedProps.height !== undefined

    if (!hasExplicitRowOrCol && hasExplicitWidth && hasExplicitHeight) {
      // Calculate edge padding to determine available space for boards
      const {
        edgePadding: edgePaddingProp,
        edgePaddingLeft: edgePaddingLeftProp,
        edgePaddingRight: edgePaddingRightProp,
        edgePaddingTop: edgePaddingTopProp,
        edgePaddingBottom: edgePaddingBottomProp,
      } = this._parsedProps

      const edgePadding = distance.parse(edgePaddingProp ?? 5)
      const edgePaddingLeft = distance.parse(edgePaddingLeftProp ?? edgePadding)
      const edgePaddingRight = distance.parse(
        edgePaddingRightProp ?? edgePadding,
      )
      const edgePaddingTop = distance.parse(edgePaddingTopProp ?? edgePadding)
      const edgePaddingBottom = distance.parse(
        edgePaddingBottomProp ?? edgePadding,
      )

      const panelWidth = distance.parse(this._parsedProps.width!)
      const panelHeight = distance.parse(this._parsedProps.height!)

      availablePanelWidth = panelWidth - edgePaddingLeft - edgePaddingRight
      availablePanelHeight = panelHeight - edgePaddingTop - edgePaddingBottom
    }

    // Pack all layoutable children into a grid
    const { positions, gridWidth, gridHeight } = packIntoGrid({
      items: gridItems,
      row: this._parsedProps.row,
      col: this._parsedProps.col,
      cellWidth: this._parsedProps.cellWidth,
      cellHeight: this._parsedProps.cellHeight,
      boardGap,
      availablePanelHeight,
      availablePanelWidth,
    })

    this._cachedGridWidth = gridWidth
    this._cachedGridHeight = gridHeight

    // Set panel position offset on each item (board or subpanel)
    for (const { item, pos } of positions) {
      item._panelPositionOffset = pos
    }
  }

  doInitialPanelLayout() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const layoutMode = this._parsedProps.layoutMode ?? "none"

    if (layoutMode === "grid") {
      // Update display offsets for all boards (direct and nested in subpanels)
      for (const child of this.children) {
        if (child instanceof Board) {
          if (!child.pcb_board_id || !child._panelPositionOffset) continue
          db.pcb_board.update(child.pcb_board_id, {
            position_mode: "relative_to_panel_anchor",
            display_offset_x: `${child._panelPositionOffset.x}mm`,
            display_offset_y: `${child._panelPositionOffset.y}mm`,
          })
        } else if (child instanceof Subpanel && child._panelPositionOffset) {
          // Update all boards inside this subpanel with combined offset
          for (const board of child._getAllBoardInstances()) {
            if (!board.pcb_board_id) continue
            const boardOffset = board._panelPositionOffset ?? { x: 0, y: 0 }
            db.pcb_board.update(board.pcb_board_id, {
              position_mode: "relative_to_panel_anchor",
              display_offset_x: `${child._panelPositionOffset.x + boardOffset.x}mm`,
              display_offset_y: `${child._panelPositionOffset.y + boardOffset.y}mm`,
            })
          }
        }
      }
      this._updatePanelDimensions()
    } else {
      // layoutMode is "none" or "pack" - use explicit positions
      const panelGlobalPos = this._getGlobalPcbPositionBeforeLayout()
      for (const board of this._getDirectBoardChildren()) {
        const boardDb = db.pcb_board.get(board.pcb_board_id!)
        if (!boardDb) continue
        db.pcb_board.update(board.pcb_board_id!, {
          position_mode: "relative_to_panel_anchor",
          display_offset_x: `${boardDb.center.x - panelGlobalPos.x}mm`,
          display_offset_y: `${boardDb.center.y - panelGlobalPos.y}mm`,
        })
      }
    }

    this._generateTabsAndMouseBites()
  }

  /**
   * Update dimensions for the subpanel. Subpanel updates pcb_group,
   */
  protected _updatePanelDimensions() {
    const { db } = this.root!
    const hasExplicitWidth = this._parsedProps.width !== undefined
    const hasExplicitHeight = this._parsedProps.height !== undefined
    const gridWidth = this._cachedGridWidth
    const gridHeight = this._cachedGridHeight

    if (!this.pcb_group_id) return

    if (hasExplicitWidth && hasExplicitHeight) {
      db.pcb_group.update(this.pcb_group_id, {
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
      const edgePaddingLeft = distance.parse(edgePaddingLeftProp ?? edgePadding)
      const edgePaddingRight = distance.parse(
        edgePaddingRightProp ?? edgePadding,
      )
      const edgePaddingTop = distance.parse(edgePaddingTopProp ?? edgePadding)
      const edgePaddingBottom = distance.parse(
        edgePaddingBottomProp ?? edgePadding,
      )

      db.pcb_group.update(this.pcb_group_id, {
        width: hasExplicitWidth
          ? distance.parse(this._parsedProps.width)
          : gridWidth + edgePaddingLeft + edgePaddingRight,
        height: hasExplicitHeight
          ? distance.parse(this._parsedProps.height)
          : gridHeight + edgePaddingTop + edgePaddingBottom,
      })
    }
  }

  /**
   * Generate tabs and mouse bites for panelization
   */
  protected _generateTabsAndMouseBites() {
    if (this._tabsAndMouseBitesGenerated) return

    const { db } = this.root!
    const props = this._parsedProps
    const panelizationMethod = props.panelizationMethod ?? "none"
    const childBoardInstances = this._getDirectBoardChildren()

    if (panelizationMethod !== "none") {
      // Get all boards that are children of this subpanel
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

  /**
   * Override to validate board containment before rendering.
   * Subpanel uses parent Group's pcb_group rendering.
   */
  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return

    // Validate that subpanel contains at least one board
    if (!this._containsBoards()) {
      throw new Error(
        `<${this._errorComponentName}> must contain at least one <board>`,
      )
    }

    // Call parent Group implementation which creates pcb_group
    super.doInitialPcbComponentRender()
  }
}
