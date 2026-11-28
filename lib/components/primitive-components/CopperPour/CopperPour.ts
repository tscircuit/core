import { type CopperPourProps, copperPourProps } from "@tscircuit/props"
import type { LayerRef, Point } from "circuit-json"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { getBoardAvailableLayers } from "lib/utils/getViaSpanLayers"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { CopperPour_doInitialPcbCopperPourRender } from "./CopperPour_doInitialPcbCopperPourRender"
import { CopperPour_doInitialPcbViaStitchRender } from "./CopperPour_doInitialPcbViaStitchRender"

export type { CopperPourProps }

export class CopperPour extends PrimitiveComponent<typeof copperPourProps> {
  isPcbPrimitive = true
  _isImplicitCopperPour = false

  get config() {
    return {
      componentName: "CopperPour",
      zodProps: copperPourProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    return { width: 0, height: 0 }
  }

  /**
   * Resolves the copper pour's physical board layer. Implicit pours are
   * already emitted on board-world layers; authored pours inside a flipped
   * container rotate 180 deg about Y ((x, y, z) -> (-x, y, -z)), reversing
   * the subcircuit's copper layer stack. Paired with
   * PrimitiveComponent._getPcbPrimitiveFlippedHelpers.
   */
  resolvePcbLayer(): LayerRef {
    const { layer } = this._parsedProps
    if (this._isImplicitCopperPour) return layer
    const { isFlipped } = this._getPcbPrimitiveFlippedHelpers()
    if (!isFlipped) return layer
    const boardLayers = getBoardAvailableLayers(
      this.getSubcircuit()._getSubcircuitLayerCount(),
    )
    const layerIndex = boardLayers.indexOf(layer)
    return layerIndex >= 0
      ? boardLayers[boardLayers.length - 1 - layerIndex]!
      : layer
  }

  /**
   * Maps authored local PCB outline points (mm, +X right, +Y up, +Z toward
   * the top layer, right-handed) to board-world PCB points in the same frame.
   * Implicit pours already store board-world vertices. Paired with
   * PrimitiveComponent._computePcbGlobalTransformBeforeLayout.
   */
  resolveBoardWorldOutline(): Point[] | undefined {
    const { outline } = this._parsedProps
    if (!outline || this._isImplicitCopperPour) return outline
    const localToBoardTransform = this._computePcbGlobalTransformBeforeLayout()
    return outline.map((vertex) => applyToPoint(localToBoardTransform, vertex))
  }

  doInitialCreateNetsFromProps(): void {
    const { _parsedProps: props } = this
    createNetsFromProps(this, [props.connectsTo])
  }

  doInitialPcbCopperPourRender(): void {
    CopperPour_doInitialPcbCopperPourRender(this)
  }

  doInitialPcbViaStitchRender(): void {
    CopperPour_doInitialPcbViaStitchRender(this)
  }
}
