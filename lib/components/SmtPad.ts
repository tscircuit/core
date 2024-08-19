import { BaseComponent } from "./BaseComponent"
import { smtPadProps } from "@tscircuit/props"

export class SmtPad extends BaseComponent<typeof smtPadProps> {
  get config() {
    return {
      zodProps: smtPadProps,
    }
  }

  doInitialPcbComponentRender(): void {
    const { db } = this.project!
    const { props } = this
    const pcb_smt_pad = db.pcb_smtpad.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer: props.layer ?? "top",
      shape: props.shape,

      // The position of a port is set by the parent, we just set to 0 initially
      x: 0,
      y: 0,

      source_port_id: this.source_component_id!,
    })
    this.pcb_smt_pad_id = pcb_smt_pad.pcb_smt_pad_id
  }
}
