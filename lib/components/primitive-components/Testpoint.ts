import { testpointProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type {
  PcbSmtPad,
  PcbPlatedHoleCircle,
  PcbSmtPadRect,
} from "circuit-json"

export class Testpoint extends PrimitiveComponent<typeof testpointProps> {
  pcb_smtpad_id: string | null = null
  pcb_plated_hole_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Testpoint",
      zodProps: testpointProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.footprintVariant === "pad") {
      if (props.padShape === "rect") {
        return {
          width: props.width ?? props.padDiameter ?? 0,
          height: props.height ?? props.padDiameter ?? 0,
        }
      }
      // circle pad
      const d = props.padDiameter ?? 0
      return { width: d, height: d }
    }
    // through hole
    const d = props.padDiameter ?? props.holeDiameter ?? 0
    return { width: d, height: d }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const pcb_group_id = this.getGroup()?.pcb_group_id ?? undefined
    if (props.footprintVariant === "pad") {
      const pcb_component_id =
        this.parent?.pcb_component_id ??
        this.getPrimitiveContainer()?.pcb_component_id ??
        undefined
      if (props.padShape === "rect") {
        const pad = db.pcb_smtpad.insert({
          pcb_component_id,
          shape: "rect",
          width: props.width ?? props.padDiameter!,
          height: props.height ?? props.padDiameter!,
          layer: props.layer ?? "top",
          port_hints: [],
          x: position.x,
          y: position.y,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id,
        }) as PcbSmtPadRect
        this.pcb_smtpad_id = pad.pcb_smtpad_id
      } else {
        const pad = db.pcb_smtpad.insert({
          pcb_component_id,
          shape: "circle",
          radius: (props.padDiameter ?? 0) / 2,
          layer: props.layer ?? "top",
          port_hints: [],
          x: position.x,
          y: position.y,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id,
        }) as PcbSmtPad
        this.pcb_smtpad_id = pad.pcb_smtpad_id
      }
    } else {
      // through_hole
      const plated = db.pcb_plated_hole.insert({
        shape: "circle" as const,
        outer_diameter: props.padDiameter ?? props.holeDiameter!,
        hole_diameter: props.holeDiameter!,
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        port_hints: [],
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id,
      }) as PcbPlatedHoleCircle
      this.pcb_plated_hole_id = plated.pcb_plated_hole_id
    }
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    if (this.pcb_smtpad_id) {
      const pad = db.pcb_smtpad.get(this.pcb_smtpad_id)!
      if (pad.shape === "rect") {
        return {
          center: { x: pad.x, y: pad.y },
          bounds: {
            left: pad.x - pad.width / 2,
            right: pad.x + pad.width / 2,
            top: pad.y - pad.height / 2,
            bottom: pad.y + pad.height / 2,
          },
          width: pad.width,
          height: pad.height,
        }
      }
      if (pad.shape === "circle") {
        return {
          center: { x: pad.x, y: pad.y },
          bounds: {
            left: pad.x - pad.radius,
            right: pad.x + pad.radius,
            top: pad.y - pad.radius,
            bottom: pad.y + pad.radius,
          },
          width: pad.radius * 2,
          height: pad.radius * 2,
        }
      }
    }
    if (this.pcb_plated_hole_id) {
      const ph = db.pcb_plated_hole.get(this.pcb_plated_hole_id)!
      return {
        center: { x: ph.x, y: ph.y },
        bounds: {
          left: ph.x - ph.outer_diameter / 2,
          right: ph.x + ph.outer_diameter / 2,
          top: ph.y - ph.outer_diameter / 2,
          bottom: ph.y + ph.outer_diameter / 2,
        },
        width: ph.outer_diameter,
        height: ph.outer_diameter,
      }
    }
    return super._getPcbCircuitJsonBounds()
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    if (this.pcb_smtpad_id) {
      db.pcb_smtpad.update(this.pcb_smtpad_id, {
        x: newCenter.x,
        y: newCenter.y,
      })
    }
    if (this.pcb_plated_hole_id) {
      db.pcb_plated_hole.update(this.pcb_plated_hole_id, {
        x: newCenter.x,
        y: newCenter.y,
      })
    }
  }
}
