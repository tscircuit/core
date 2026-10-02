import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { distance } from "circuit-json"
import { fiducialProps } from "@tscircuit/props"

export class Fiducial extends PrimitiveComponent<typeof fiducialProps> {
  pcb_smtpad_id: string | null = null
  pcb_courtyard_circle_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Fiducial",
      zodProps: fiducialProps,
      sourceFtype: "simple_fiducial" as const,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const position = this._getGlobalPcbPositionBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top")
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for Fiducial. Must be "top" or "bottom".`,
      )
    }
    const radius = distance.parse(props.padDiameter) / 2
    const soldermask_margin = props.soldermaskPullback ?? radius

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const pcb_smtpad = db.pcb_smtpad.insert({
      pcb_component_id,
      layer,
      shape: "circle",
      x: position.x,
      y: position.y,
      radius,
      soldermask_margin,
      is_covered_with_solder_mask: true,
    })

    this.pcb_smtpad_id = pcb_smtpad.pcb_smtpad_id

    const courtyard = db.pcb_courtyard_circle.insert({
      pcb_component_id,
      layer,
      center: position,
      radius: radius + soldermask_margin,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })
    this.pcb_courtyard_circle_id = courtyard.pcb_courtyard_circle_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const d = distance.parse(props.padDiameter)
    return { width: d, height: d }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }): void {
    if (!this.pcb_smtpad_id) return
    const { db } = this.root!
    db.pcb_smtpad.update(this.pcb_smtpad_id, {
      x: newCenter.x,
      y: newCenter.y,
    })
    if (this.pcb_courtyard_circle_id) {
      db.pcb_courtyard_circle.update(this.pcb_courtyard_circle_id, {
        center: newCenter,
      })
    }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_smtpad_id) return

    const pad = db.pcb_smtpad.get(this.pcb_smtpad_id)
    if (!pad) return
    if (
      pad.shape === "rect" ||
      pad.shape === "circle" ||
      pad.shape === "rotated_rect" ||
      pad.shape === "pill"
    ) {
      this._setPositionFromLayout({ x: pad.x + deltaX, y: pad.y + deltaY })
    } else if (pad.shape === "polygon") {
      db.pcb_smtpad.update(this.pcb_smtpad_id, {
        points: pad.points.map((p) => ({
          x: p.x + deltaX,
          y: p.y + deltaY,
        })),
      })
    }
  }
}
