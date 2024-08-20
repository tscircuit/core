import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { smtPadProps } from "@tscircuit/props"
import type { Port } from "./Port"

export class SmtPad extends PrimitiveComponent<typeof smtPadProps> {
  pcb_smtpad_id: string | null = null

  matchedPort: Port | null = null

  isPcbPrimitive = true

  get config() {
    return {
      zodProps: smtPadProps,
    }
  }

  doPortMatching(): void {
    const parentPorts = (this.parent?.children ?? []).filter(
      (c) => c.componentName === "Port",
    ) as Port[]

    if (!this.props.portHints) {
      return
    }

    for (const port of parentPorts) {
      if (port.doesMatchAnyAlias(this.props.portHints)) {
        this.matchedPort = port
        return
      }
    }
  }

  doInitialPcbComponentRender(): void {
    const { db } = this.project!
    const { props } = this
    if (!props.portHints) return
    const pcb_smt_pad = db.pcb_smtpad.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer: props.layer ?? "top",
      shape: props.shape,

      // The position of a port is set by the parent, we just set to 0 initially
      x: 0,
      y: 0,

      pcb_port_id: this.matchedPort?.pcb_port_id!,
    })
    this.pcb_smtpad_id = pcb_smt_pad.pcb_smtpad_id
  }
}
