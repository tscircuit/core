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

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "circle") {
      return { width: props.outerDiameter, height: props.outerDiameter }
    }
    if (props.shape === "oval") {
      return { width: props.outerWidth, height: props.outerHeight }
    }
    throw new Error(
      `getPcbSize for shape "${(props as any).shape}" not implemented for ${this.componentName}`,
    )
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    const platedHole = db.pcb_plated_hole.get(this.pcb_plated_hole_id!)!
    const size = this.getPcbSize()

    return {
      center: { x: platedHole.x, y: platedHole.y },
      bounds: {
        left: platedHole.x - size.width / 2,
        top: platedHole.y - size.height / 2,
        right: platedHole.x + size.width / 2,
        bottom: platedHole.y + size.height / 2,
      },
      width: size.width,
      height: size.height,
    }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    db.pcb_plated_hole.update(this.pcb_plated_hole_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })
    this.matchedPort?._setPositionFromLayout(newCenter)
  }

  doInitialPortMatching(): void {
    const parentPorts = this.getPrimitiveContainer()?.selectAll(
      "port",
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
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    if (props.shape === "circle") {
      const pcb_plated_hole = db.pcb_plated_hole.insert({
        pcb_component_id: this.parent?.pcb_component_id!,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        // @ts-ignore - some issue with @tscircuit/soup union type
        outer_diameter: props.outerDiameter,
        hole_diameter: props.holeDiameter,
        shape: "circle" as const,
        port_hints: this.getNameAndAliases(),
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
      })

      this.pcb_plated_hole_id = pcb_plated_hole.pcb_plated_hole_id
    }
  }
}
