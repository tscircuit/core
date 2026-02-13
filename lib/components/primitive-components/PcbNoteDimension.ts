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
        `.${input}`,
      ) as PrimitiveComponent | null
      if (!target) {
        this.renderError(`PcbNoteDimension could not find selector "${input}"`)
        return applyToPoint(transform, { x: 0, y: 0 })
      }
      const targetPcbComponentId = (
        target as PrimitiveComponent & {
          pcb_component_id?: string
        }
      ).pcb_component_id
      const root = this.root

      if (targetPcbComponentId && root) {
        const pcbComponent = root.db.pcb_component.get(targetPcbComponentId)
        if (pcbComponent?.center) {
          return {
            x: pcbComponent.center.x,
            y: pcbComponent.center.y,
          }
        }
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

    const text =
      props.text ??
      this._formatDistanceText({ from, to, units: props.units ?? "mm" })

    const pcb_note_dimension = db.pcb_note_dimension.insert({
      pcb_component_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: group?.pcb_group_id ?? undefined,
      from,
      to,
      text,
      font: props.font ?? "tscircuit2024",
      font_size: props.fontSize ?? 1,
      color: props.color,
      arrow_size: props.arrowSize ?? 1,
    })

    this.pcb_note_dimension_id = pcb_note_dimension.pcb_note_dimension_id
  }

  doInitialPcbLayout(): void {
    const root = this.root
    if (!root || root.pcbDisabled) return
    if (!this.pcb_note_dimension_id) return

    const { db } = root
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const from = this._resolvePoint(this._parsedProps.from, transform)
    const to = this._resolvePoint(this._parsedProps.to, transform)

    db.pcb_note_dimension.update(this.pcb_note_dimension_id, {
      from,
      to,
    })
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

  private _formatDistanceText({
    from,
    to,
    units,
  }: {
    from: Point
    to: Point
    units: "mm" | "in"
  }): string {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distanceInMillimeters = Math.sqrt(dx * dx + dy * dy)

    const distanceInUnits =
      units === "in" ? distanceInMillimeters / 25.4 : distanceInMillimeters

    const roundedDistance = Math.round(distanceInUnits)
    const isWholeNumber = Math.abs(distanceInUnits - roundedDistance) < 1e-9

    if (isWholeNumber) {
      return `${roundedDistance}${units}`
    }

    const decimalPlaces = units === "in" ? 3 : 2
    const valueText =
      units === "in"
        ? Number(distanceInUnits.toFixed(decimalPlaces)).toString()
        : distanceInUnits.toFixed(decimalPlaces)

    return `${valueText}${units}`
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_note_dimension_id) return

    const dimension = db.pcb_note_dimension.get(this.pcb_note_dimension_id)

    if (dimension) {
      db.pcb_note_dimension.update(this.pcb_note_dimension_id, {
        from: {
          x: dimension.from.x + deltaX,
          y: dimension.from.y + deltaY,
        },
        to: {
          x: dimension.to.x + deltaX,
          y: dimension.to.y + deltaY,
        },
      })
    }
  }
}
