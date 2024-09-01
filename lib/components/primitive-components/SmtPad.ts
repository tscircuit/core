import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { smtPadProps } from "@tscircuit/props"
import type { Port } from "./Port"
import type { RenderPhaseFn } from "../base-components/Renderable"
import type { PCBSMTPad } from "@tscircuit/soup"
import { decomposeTSR } from "transformation-matrix"

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
      if (port.isMatchingAnyOf(this.props.portHints)) {
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
    const position = this.getGlobalPcbPosition()
    const decomposedMat = decomposeTSR(this.computePcbGlobalTransform())
    const isRotated90 =
      Math.abs(decomposedMat.rotation.angle * (180 / Math.PI) - 90) < 0.01
    let pcb_smtpad: PCBSMTPad | null = null
    if (props.shape === "circle") {
      pcb_smtpad = db.pcb_smtpad.insert({
        pcb_component_id: this.parent?.pcb_component_id!,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        layer: props.layer ?? "top",
        shape: "circle",

        // @ts-ignore: no idea why this is triggering
        radius: props.radius!,

        port_hints: props.portHints.map((ph) => ph.toString()),

        x: position.x,
        y: position.y,
      })
    } else if (props.shape === "rect") {
      pcb_smtpad = db.pcb_smtpad.insert({
        pcb_component_id: this.parent?.pcb_component_id!,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        layer: props.layer ?? "top",
        shape: "rect",

        ...(isRotated90
          ? { width: props.height, height: props.width }
          : { width: props.width, height: props.height }),

        port_hints: props.portHints.map((ph) => ph.toString()),

        x: position.x,
        y: position.y,
      })
    }
    if (pcb_smtpad) {
      this.pcb_smtpad_id = pcb_smtpad.pcb_smtpad_id
    }
  }
}
