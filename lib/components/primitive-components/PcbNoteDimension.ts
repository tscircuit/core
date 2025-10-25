import { pcbNoteDimensionProps } from "@tscircuit/props"
import type { Point } from "circuit-json"
import { applyToPoint, type Matrix } from "transformation-matrix"
import {
  calculateDimensionPoints,
  getDimensionModeFromProps,
  type DimensionTarget,
} from "./shared/calculateDimensionPoints"
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

  private _resolveTarget(
    input: string | Point,
    transform: Matrix,
  ): DimensionTarget {
    if (typeof input === "string") {
      const selector =
        input.startsWith(".") || input.startsWith("#") ? input : `.${input}`
      const target = this.getSubcircuit().selectOne(
        selector,
      ) as PrimitiveComponent | null

      if (!target) {
        this.renderError(`PcbNoteDimension could not find selector "${input}"`)
        return {
          center: applyToPoint(transform, { x: 0, y: 0 }),
          width: 0,
          height: 0,
        }
      }

      const bounds = target._getPcbCircuitJsonBounds?.()
      if (bounds) {
        return {
          center: bounds.center,
          width: bounds.width,
          height: bounds.height,
        }
      }

      return {
        center: target._getGlobalPcbPositionBeforeLayout(),
        width: 0,
        height: 0,
      }
    }

    const numericX = typeof input.x === "string" ? parseFloat(input.x) : input.x
    const numericY = typeof input.y === "string" ? parseFloat(input.y) : input.y
    const center = applyToPoint(transform, { x: numericX, y: numericY })
    return { center, width: 0, height: 0 }
  }

  private _computeDimensionPoints(): { from: Point; to: Point } {
    const { _parsedProps: props } = this
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const fromTarget = this._resolveTarget(props.from, transform)
    const toTarget = this._resolveTarget(props.to, transform)
    const mode = getDimensionModeFromProps(props)

    const { fromPoint, toPoint } = calculateDimensionPoints({
      fromTarget,
      toTarget,
      mode,
    })

    return { from: fromPoint, to: toPoint }
  }

  private _computeDimensionText(from: Point, to: Point): string {
    const { _parsedProps: props } = this
    return (
      props.text ??
      this._formatDistanceText({
        from,
        to,
        units: props.units ?? "mm",
      })
    )
  }

  doInitialPcbDimensionRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { from, to } = this._computeDimensionPoints()
    const text = this._computeDimensionText(from, to)
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id ??
      undefined

    const insertPayload = {
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
      offset: props.offset,
    }

    const pcb_note_dimension = db.pcb_note_dimension.insert(
      insertPayload as Parameters<typeof db.pcb_note_dimension.insert>[0],
    )

    this.pcb_note_dimension_id = pcb_note_dimension.pcb_note_dimension_id
  }

  getPcbSize(): { width: number; height: number } {
    const { from, to } = this._computeDimensionPoints()

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
}
