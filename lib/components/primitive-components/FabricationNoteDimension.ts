import { fabricationNoteDimensionProps as baseFabricationNoteDimensionProps } from "@tscircuit/props"
import type { Point } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"
import {
  adjustDimensionPoints,
  formatDimensionDistance,
  resolveNoteDimensionTarget,
  type NoteDimensionMeasurementMode,
} from "lib/utils/resolve-note-dimension-points"

const fabricationNoteDimensionProps = baseFabricationNoteDimensionProps.extend({
  centerToCenter: z.literal(true).optional(),
  innerEdgeToEdge: z.literal(true).optional(),
  outerEdgeToEdge: z.literal(true).optional(),
})

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

  private _computeResolvedDimension(): {
    from: Point
    to: Point
    text: string
  } {
    const { _parsedProps: props } = this
    const mode = this._resolveMeasurementMode()

    const resolveSelector = (input: string) => {
      const isSimple = /^[\w-]+$/.test(input)
      const normalized = isSimple ? `.${input}` : input
      return this.getSubcircuit().selectOne(
        normalized,
      ) as PrimitiveComponent | null
    }

    const fromTarget = resolveNoteDimensionTarget({
      dimension: this,
      input: props.from,
      resolveComponent: resolveSelector,
    })
    const toTarget = resolveNoteDimensionTarget({
      dimension: this,
      input: props.to,
      resolveComponent: resolveSelector,
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
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()

    const resolvedLayer = maybeFlipLayer(props.layer ?? "top")
    if (resolvedLayer !== "top" && resolvedLayer !== "bottom") {
      throw new Error(
        `Invalid layer "${resolvedLayer}" for FabricationNoteDimension. Must be "top" or "bottom".`,
      )
    }
    const layer: "top" | "bottom" = resolvedLayer

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

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

  updatePcbDimensionRender(): void {
    if (this.root?.pcbDisabled) return
    if (!this.fabrication_note_dimension_id) {
      this.doInitialPcbDimensionRender()
      return
    }

    const { db } = this.root!
    const { _parsedProps: props } = this
    const { from, to, text } = this._computeResolvedDimension()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const resolvedLayer = maybeFlipLayer(props.layer ?? "top")
    if (resolvedLayer !== "top" && resolvedLayer !== "bottom") {
      throw new Error(
        `Invalid layer "${resolvedLayer}" for FabricationNoteDimension. Must be "top" or "bottom".`,
      )
    }
    const layer: "top" | "bottom" = resolvedLayer

    db.pcb_fabrication_note_dimension.update(
      this.fabrication_note_dimension_id,
      {
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
  }

  removePcbDimensionRender(): void {
    if (!this.root?.db || !this.fabrication_note_dimension_id) return
    this.root.db.pcb_fabrication_note_dimension.delete(
      this.fabrication_note_dimension_id,
    )
    this.fabrication_note_dimension_id = null
  }

  getPcbSize(): { width: number; height: number } {
    const { from, to } = this._computeResolvedDimension()

    return {
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y),
    }
  }
}
