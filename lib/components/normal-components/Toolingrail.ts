import { toolingrailProps } from "@tscircuit/props"
import { distance, pcb_group } from "circuit-json"
import { getOwningPanel } from "lib/utils/panels/get-owning-panel"
import {
  applyToPoint,
  compose,
  inverse,
  translate,
  type Matrix,
} from "transformation-matrix"
import { Group } from "../primitive-components/Group/Group"

export class Toolingrail extends Group<typeof toolingrailProps> {
  get isGroup() {
    return true
  }

  override doInitialSchematicComponentRender(): void {}
  override doInitialSchematicLayout(): void {}
  override doInitialSchematicTraceRender(): void {}

  get config() {
    return { componentName: "Toolingrail", zodProps: toolingrailProps }
  }

  override _getPcbLayoutMode(): "none" {
    return "none"
  }

  /** Rail centre and dimensions in panel-local mm (+X right, +Y up). The centre is a point and receives the panel translation. */
  _getRailGeometry() {
    const panel = getOwningPanel(this)
    if (!panel) return
    const props = panel.props
    const padding = distance.parse(props.edgePadding ?? 5)
    const left = distance.parse(props.edgePaddingLeft ?? padding)
    const right = distance.parse(props.edgePaddingRight ?? padding)
    const top = distance.parse(props.edgePaddingTop ?? padding)
    const bottom = distance.parse(props.edgePaddingBottom ?? padding)
    const width =
      props.width === undefined
        ? panel._cachedGridWidth + left + right
        : distance.parse(props.width)
    const height =
      props.height === undefined
        ? panel._cachedGridHeight + top + bottom
        : distance.parse(props.height)
    const railWidth = this._parsedProps.width
    const side = this._parsedProps.panelSide
    const availablePadding = { left, right, top, bottom }[side]
    if (railWidth > availablePadding)
      throw new Error(
        `Tooling rail width ${railWidth} mm exceeds the ${side} edge padding of ${availablePadding} mm. Increase that panel edge padding.`,
      )
    return {
      x:
        side === "left"
          ? -width / 2 + railWidth / 2
          : side === "right"
            ? width / 2 - railWidth / 2
            : 0,
      y:
        side === "bottom"
          ? -height / 2 + railWidth / 2
          : side === "top"
            ? height / 2 - railWidth / 2
            : 0,
      width: side === "left" || side === "right" ? railWidth : width,
      height: side === "top" || side === "bottom" ? railWidth : height,
    }
  }

  override _computePcbGlobalTransformBeforeLayout(): Matrix {
    const baseTransform = super._computePcbGlobalTransformBeforeLayout()
    const rail = this._getRailGeometry()
    if (!rail || !this.parent) return baseTransform
    const panelTransform = this.parent._computePcbGlobalTransformBeforeLayout()
    return compose(
      panelTransform,
      translate(rail.x, rail.y),
      inverse(panelTransform),
      baseTransform,
    )
  }

  override getPcbSize() {
    const rail = this._getRailGeometry()
    return { width: rail?.width ?? 0, height: rail?.height ?? 0 }
  }

  override calculatePcbGroupBounds() {
    if (this.root?.pcbDisabled || !this.pcb_group_id) return
    const rail = this._getRailGeometry()
    if (!rail) return
    // Group normally infers its bounds from child components. A rail's strip
    // exists even when it contains only annotations or no children.
    const center = applyToPoint(this._computePcbGlobalTransformBeforeLayout(), {
      x: 0,
      y: 0,
    })
    this.root!.db.pcb_group.update(this.pcb_group_id, {
      center,
      width: rail.width,
      height: rail.height,
    })
  }

  override doInitialPcbComponentRender() {
    if (this.parent?.componentName !== "Panel")
      throw new Error("<toolingrail> must be a direct child of <panel>")
    this._getRailGeometry()
    super.doInitialPcbComponentRender()
    if (this.pcb_group_id)
      this.root!.db.pcb_group.update(this.pcb_group_id, {
        anchor_alignment: pcb_group.shape.anchor_alignment.parse(
          this._parsedProps.pcbAnchorAlignment ?? "center",
        ),
      })
  }
}
