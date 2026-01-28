import { panelProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import { Subpanel } from "./Subpanel"

/**
 * Panel is the root-level panel component for organizing multiple boards.
 * It extends Subpanel but uses pcb_panel instead of pcb_group for the
 * PCB representation, since Panel represents the physical manufacturing panel.
 *
 * Both Panel and Subpanel:
 * - Can contain Board elements
 * - Can contain Subpanel elements (for nested grouping)
 * - Support grid layout mode for automatic board positioning
 * - Support tab routing and mouse bites for panelization
 */
export class Panel extends Subpanel {
  get config() {
    return {
      componentName: "Panel",
      zodProps: panelProps,
    }
  }

  /**
   * Panel creates a pcb_panel record for the physical manufacturing panel.
   * This overrides the Subpanel behavior which uses pcb_group.
   */
  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return

    // Validate that panel contains at least one board
    if (!this._containsBoards()) {
      throw new Error(
        `<${this._errorComponentName}> must contain at least one <board>`,
      )
    }

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

  /**
   * Panel updates pcb_panel dimensions instead of pcb_group
   */
  protected _updatePanelDimensions() {
    const { db } = this.root!
    const hasExplicitWidth = this._parsedProps.width !== undefined
    const hasExplicitHeight = this._parsedProps.height !== undefined
    const gridWidth = this._cachedGridWidth
    const gridHeight = this._cachedGridHeight

    if (!this.pcb_panel_id) return

    if (hasExplicitWidth && hasExplicitHeight) {
      db.pcb_panel.update(this.pcb_panel_id, {
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

      db.pcb_panel.update(this.pcb_panel_id, {
        width: hasExplicitWidth
          ? distance.parse(this._parsedProps.width)
          : gridWidth + edgePaddingLeft + edgePaddingRight,
        height: hasExplicitHeight
          ? distance.parse(this._parsedProps.height)
          : gridHeight + edgePaddingTop + edgePaddingBottom,
      })
    }
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
