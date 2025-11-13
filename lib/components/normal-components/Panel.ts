import { panelProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Group } from "../primitive-components/Group/Group"

export class Panel extends Group<typeof panelProps> {
  pcb_panel_id: string | null = null

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
