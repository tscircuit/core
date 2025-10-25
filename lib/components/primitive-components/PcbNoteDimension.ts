import { pcbNoteDimensionProps as basePcbNoteDimensionProps } from "@tscircuit/props"
import { z } from "zod"
import type { Point } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import {
  adjustDimensionPoints,
  formatDimensionDistance,
  resolveNoteDimensionTarget,
  type NoteDimensionMeasurementMode,
} from "lib/utils/resolve-note-dimension-points"

const pcbNoteDimensionProps = basePcbNoteDimensionProps.extend({
  centerToCenter: z.literal(true).optional(),
  innerEdgeToEdge: z.literal(true).optional(),
  outerEdgeToEdge: z.literal(true).optional(),
})

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

  private _resolveMeasurementMode(): NoteDimensionMeasurementMode {
    const { innerEdgeToEdge, outerEdgeToEdge, centerToCenter } =
      this._parsedProps
    const truthyFlags = [
      innerEdgeToEdge,
      outerEdgeToEdge,
      centerToCenter,
    ].filter(Boolean)

    if (truthyFlags.length > 1) {
      this.renderError(
        "Only one of innerEdgeToEdge, outerEdgeToEdge, or centerToCenter can be set",
      )
    }

    if (innerEdgeToEdge) return "inner"
    if (outerEdgeToEdge) return "outer"
    return "center"
  }

  private _resolveSelector(selector: string): PrimitiveComponent | null {
    const isSimple = /^[\w-]+$/.test(selector)
    const normalizedSelector = isSimple ? `.${selector}` : selector
    return this.getSubcircuit().selectOne(
      normalizedSelector,
    ) as PrimitiveComponent | null
  }

  private _computeResolvedDimension(): {
    from: Point
    to: Point
    text: string
  } {
    const { _parsedProps: props } = this
    const mode = this._resolveMeasurementMode()

    const fromTarget = resolveNoteDimensionTarget({
      dimension: this,
      input: props.from,
      resolveComponent: (input) => this._resolveSelector(input),
    })
    const toTarget = resolveNoteDimensionTarget({
      dimension: this,
      input: props.to,
      resolveComponent: (input) => this._resolveSelector(input),
    })

    const { from, to, missingBoundsFor } = adjustDimensionPoints({
      from: fromTarget,
      to: toTarget,
      mode,
    })

    if (missingBoundsFor.length > 0 && mode !== "center") {
      this.renderError(
        `Falling back to center-to-center measurement because ${missingBoundsFor.join(
          " and ",
        )} ${missingBoundsFor.length === 1 ? "target lacks" : "targets lack"} PCB bounds`,
      )
    }

    const units = props.units ?? "mm"
    const text =
      props.text ??
      formatDimensionDistance({
        from,
        to,
        units,
      })

    return { from, to, text }
  }

  doInitialPcbDimensionRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { from, to, text } = this._computeResolvedDimension()
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
      text,
      font: props.font ?? "tscircuit2024",
      font_size: props.fontSize ?? 1,
      color: props.color,
      arrow_size: props.arrowSize ?? 1,
    })

    this.pcb_note_dimension_id = pcb_note_dimension.pcb_note_dimension_id
  }

  updatePcbDimensionRender(): void {
    if (this.root?.pcbDisabled) return
    if (!this.pcb_note_dimension_id) {
      this.doInitialPcbDimensionRender()
      return
    }

    const { db } = this.root!
    const { _parsedProps: props } = this
    const { from, to, text } = this._computeResolvedDimension()

    db.pcb_note_dimension.update(this.pcb_note_dimension_id, {
      from,
      to,
      text,
      font: props.font ?? "tscircuit2024",
      font_size: props.fontSize ?? 1,
      color: props.color,
      arrow_size: props.arrowSize ?? 1,
    })
  }

  removePcbDimensionRender(): void {
    if (!this.root?.db || !this.pcb_note_dimension_id) return
    this.root.db.pcb_note_dimension.delete(this.pcb_note_dimension_id)
    this.pcb_note_dimension_id = null
  }

  getPcbSize(): { width: number; height: number } {
    const { from, to } = this._computeResolvedDimension()

    return {
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y),
    }
  }
}
