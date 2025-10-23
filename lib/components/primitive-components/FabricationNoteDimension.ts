import { fabricationNoteDimensionProps } from "@tscircuit/props"
import type { Point } from "circuit-json"
import { applyToPoint, type Matrix } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class FabricationNoteDimension extends PrimitiveComponent<
  typeof fabricationNoteDimensionProps
> {
  fabrication_note_dimension_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "FabricationNoteDimension",
      zodProps: fabricationNoteDimensionProps,
    }
  }

  private _resolvePoint(input: string | Point, transform: Matrix): Point {
    if (typeof input === "string") {
      const target = this.getSubcircuit().selectOne(
        input,
      ) as PrimitiveComponent | null
      if (!target) {
        this.renderError(
          `FabricationNoteDimension could not find selector "${input}"`,
        )
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
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()

    const layer = maybeFlipLayer(props.layer ?? "top")
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for FabricationNoteDimension. Must be "top" or "bottom".`,
      )
    }

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const text =
      props.text ??
      this._formatDistanceText({ from, to, units: props.units ?? "mm" })

    const fabrication_note_dimension = db.pcb_fabrication_note_dimension.insert(
      {
        pcb_component_id,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: group?.pcb_group_id ?? undefined,
        layer,
        from,
        to,
        text,
        offset: props.offset,
        font: props.font ?? "tscircuit2024",
        font_size: props.fontSize ?? 1,
        color: props.color,
        arrow_size: props.arrowSize ?? 1,
      },
    )

    this.fabrication_note_dimension_id =
      fabrication_note_dimension.pcb_fabrication_note_dimension_id
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
}
