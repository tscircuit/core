import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { smtPadProps } from "@tscircuit/props"
import type { Port } from "./Port"
import type { RenderPhaseFn } from "../base-components/Renderable"

export class SmtPad extends PrimitiveComponent<typeof smtPadProps> {
  pcb_smtpad_id: string | null = null

  matchedPort: Port | null = null

  isPcbPrimitive = true

  get config() {
    return {
      zodProps: smtPadProps,
    }
  }

  doInitialPortMatching(): void {
    const parentPorts = (this.parent?.children ?? []).filter(
      (c) => c.componentName === "Port",
    ) as Port[]

    if (!this.props.portHints) {
      return
    }

    for (const port of parentPorts) {
      if (port.doesMatchAnyAlias(this.props.portHints)) {
        this.matchedPort = port
        port.registerMatch(this)
        return
      }
    }
  }

  doInitialPcbPrimitiveRender(): void {
    const { db } = this.project!
    const { _parsedProps: props } = this
    if (!props.portHints) return
    const pcb_smt_pad = db.pcb_smtpad.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      pcb_port_id: this.matchedPort?.pcb_port_id!,
      layer: props.layer ?? "top",
      shape: props.shape,
      port_hints: props.portHints.map((ph) => ph.toString()),

      x: props.pcbX ?? 0,
      y: props.pcbY ?? 0,
    })
    this.pcb_smtpad_id = pcb_smt_pad.pcb_smtpad_id
  }

  getPortPosition(): { x: number; y: number } {
    const { _parsedProps: props } = this
    return {
      x: props.pcbX ?? 0,
      y: props.pcbY ?? 0,
    }
  }
}
