import { pcbKeepoutProps } from "@tscircuit/props"
import type { PCBKeepout } from "circuit-json"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { decomposeTSR } from "transformation-matrix"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class Keepout extends PrimitiveComponent<typeof pcbKeepoutProps> {
  pcb_keepout_id: string | null = null

  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Keepout",
      zodProps: pcbKeepoutProps,
    }
  }

  getExcludedPcbComponentIds(): PcbComponentId[] {
    const excludedPcbComponentIds =
      this._parsedProps.excludeRefs?.flatMap((selector) =>
        this.getSubcircuit()
          .selectAll(selector)
          .map((component) => component.pcb_component_id)
          .filter((id): id is PcbComponentId => id !== null),
      ) ?? []

    return Array.from(new Set(excludedPcbComponentIds))
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const subcircuit = this.getSubcircuit()
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    let layers = props.layers
    if (!layers && props.layer) {
      layers = [props.layer]
    }
    if (!layers) {
      layers = ["top"]
    }
    // Surface layers follow the same footprint flip as SmtPad. Inner layer
    // references remain board-relative; the helper only flips surface layers.
    layers = layers.map((layer) =>
      layer === "top" || layer === "bottom" ? maybeFlipLayer(layer) : layer,
    )
    const excludedPcbComponentIds = this.getExcludedPcbComponentIds()
    const pcbKeepoutExclusionProps =
      excludedPcbComponentIds.length > 0
        ? { excluded_pcb_component_ids: excludedPcbComponentIds }
        : {}

    let pcb_keepout: PCBKeepout | null = null
    if (props.shape === "circle") {
      pcb_keepout = db.pcb_keepout.insert({
        layers,
        shape: "circle",
        ...pcbKeepoutExclusionProps,
        ...(props.allowTraces !== undefined
          ? { allow_traces: props.allowTraces }
          : {}),
        ...(props.allowPlacements !== undefined
          ? { allow_placements: props.allowPlacements }
          : {}),
        ...(props.warningOnly !== undefined
          ? { warning_only: props.warningOnly }
          : {}),
        // @ts-ignore: no idea why this is triggering
        radius: props.radius,
        center: {
          x: position.x,
          y: position.y,
        },
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      })
    } else if (props.shape === "rect") {
      const bounds = this._getPcbBoundsBeforeLayout()
      pcb_keepout = db.pcb_keepout.insert({
        layers,
        shape: "rect",
        ...pcbKeepoutExclusionProps,
        ...(props.allowTraces !== undefined
          ? { allow_traces: props.allowTraces }
          : {}),
        ...(props.allowPlacements !== undefined
          ? { allow_placements: props.allowPlacements }
          : {}),
        ...(props.warningOnly !== undefined
          ? { warning_only: props.warningOnly }
          : {}),
        width: bounds.right - bounds.left,
        height: bounds.top - bounds.bottom,
        // @ts-ignore: no idea why this is triggering
        center: {
          x: position.x,
          y: position.y,
        },
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      })
    }
    if (pcb_keepout) {
      this.pcb_keepout_id = pcb_keepout.pcb_keepout_id
    }
  }

  /**
   * Axis-aligned bounds in board-world mm (+X right, +Y top, +Z above,
   * right-handed). Rect keepouts cannot store rotation, so these bounds
   * conservatively cover the footprint-local rectangle using the same
   * transform as doInitialPcbPrimitiveRender's center point.
   */
  _getPcbBoundsBeforeLayout() {
    const { _parsedProps: props } = this
    if (props.shape !== "rect") return super._getPcbBoundsBeforeLayout()
    const center = this._getGlobalPcbPositionBeforeLayout()
    const { rotation } = decomposeTSR(
      this._computePcbGlobalTransformBeforeLayout(),
    )
    const { width, height } = getAxisAlignedSizeFromRotatedRect({
      width: props.width,
      height: props.height,
      ccwRotationDegrees: (rotation.angle * 180) / Math.PI,
    })
    return {
      left: center.x - width / 2,
      right: center.x + width / 2,
      top: center.y + height / 2,
      bottom: center.y - height / 2,
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "circle") {
      return { width: props.radius * 2, height: props.radius * 2 }
    }
    if (props.shape === "rect") {
      return { width: props.width, height: props.height }
    }
    return { width: 0, height: 0 }
  }
}
