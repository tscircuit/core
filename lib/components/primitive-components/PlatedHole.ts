import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { platedHoleProps } from "@tscircuit/props"
import type { Port } from "./Port"
import type { PCBPlatedHoleInput } from "@tscircuit/soup"

export class PlatedHole extends PrimitiveComponent<typeof platedHoleProps> {
  pcb_plated_hole_id: string | null = null
  matchedPort: Port | null = null
  isPcbPrimitive = true

  get config() {
    return {
      zodProps: platedHoleProps,
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
    if (props.shape === "circle") {
      const plated_hole_input: PCBPlatedHoleInput = {
        pcb_component_id: this.parent?.pcb_component_id!,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        layers: ["top", "bottom"],
        outer_diameter: props.outerDiameter,
        hole_diameter: props.holeDiameter,
        shape: "circle",
        port_hints: this.getNameAndAliases(),
        x: position.x,
        y: position.y,
        type: "pcb_plated_hole",
      }

      // @ts-ignore - some issue with soup-util types it seems
      const pcb_plated_hole = db.pcb_plated_hole.insert(plated_hole_input)

      // this.pcb_plated_hole_id = pcb_plated_hole.pcb_plated_hole_id
    }
  }
}
