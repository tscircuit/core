import { panelTabProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Declarative board-edge control; consumed by the parent panel after board layout. */
export class PanelTab extends PrimitiveComponent<typeof panelTabProps> {
  get config() {
    return { componentName: "PanelTab", zodProps: panelTabProps }
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    if (
      this.parent?.componentName !== "Panel" &&
      this.parent?.componentName !== "Subpanel"
    )
      throw new Error(
        "<paneltab> must be a direct child of <panel> or <subpanel>",
      )
  }
}
