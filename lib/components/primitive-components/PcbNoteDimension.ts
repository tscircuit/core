import { pcbNoteDimensionProps } from "@tscircuit/props"
import type { Point } from "circuit-json"
import { applyToPoint, type Matrix } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class PcbNoteDimension extends PrimitiveComponent<
  typeof pcbNoteDimensionProps
> {
  pcb_note_dimension_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbNoteDimension",
      zodProps: pcbNoteDimensionProps,
    }
  }

  private _resolvePoint(input: string | Point, transform: Matrix): Point {
    if (typeof input === "string") {
      const target = this.getSubcircuit().selectOne(
        input,
      ) as PrimitiveComponent | null
      if (!target) {
        this.renderError(`PcbNoteDimension could not find selector "${input}"`)
        return applyToPoint(transform, { x: 0, y: 0 })
      }
      return target._getGlobalPcbPositionBeforeLayout()
    }

    const numericX = typeof input.x === "string" ? parseFloat(input.x) : input.x
    const numericY = typeof input.y === "string" ? parseFloat(input.y) : input.y
    return applyToPoint(transform, { x: numericX, y: numericY })
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const from = this._resolvePoint(props.from, transform)
    const to = this._resolvePoint(props.to, transform)
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id ??
      undefined

    const pcb_note_dimension = db.pcb_note_dimension.insert({
      pcb_component_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: group?.pcb_group_id ?? undefined,
      from,
      to,
      text: props.text,
      font: props.font ?? "tscircuit2024",
      font_size: props.fontSize ?? 1,
      color: props.color,
      arrow_size: props.arrowSize ?? 1,
    })

    this.pcb_note_dimension_id = pcb_note_dimension.pcb_note_dimension_id
  }

  getPcbSize(): { width: number; height: number } {
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const from = this._resolvePoint(this._parsedProps.from, transform)
    const to = this._resolvePoint(this._parsedProps.to, transform)

    return {
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y),
    }
  }
}
