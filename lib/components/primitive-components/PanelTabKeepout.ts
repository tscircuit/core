import { panelTabKeepoutProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Declarative board-edge control; consumed by the parent panel after board layout. */
export class PanelTabKeepout extends PrimitiveComponent<
  typeof panelTabKeepoutProps
> {
  get config() {
    return { componentName: "PanelTabKeepout", zodProps: panelTabKeepoutProps }
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    if (
      this.parent?.componentName !== "Panel" &&
      this.parent?.componentName !== "Subpanel"
    )
      throw new Error(
        "<paneltabkeepout> must be a direct child of <panel> or <subpanel>",
      )
  }
}
