import { layer_ref } from "circuit-json"
import { BaseBreakoutPoint, baseBreakoutPointProps } from "./BaseBreakoutPoint"

/**
 * Internal-only breakout point that is created automatically by
 * `Breakout.doInitialCreateAutoplacedBreakoutPoints()` for ports whose
 * traces cross the breakout boundary. Unlike user-facing `BreakoutPoint`,
 * this class does NOT require a `connection` prop — its `matchedPort`
 * is set programmatically. It renders only after the solver returns a real
 * boundary position, so a failed solve cannot leave a phantom point behind.
 */
export class AutoplacedBreakoutPoint extends BaseBreakoutPoint<
  typeof baseBreakoutPointProps
> {
  get config() {
    return {
      componentName: "AutoplacedBreakoutPoint",
      zodProps: baseBreakoutPointProps,
    }
  }

  _applySolvedBreakoutPoint({
    sourceTraceId,
    layer,
    position,
  }: {
    sourceTraceId: string
    layer: string
    position: { x: number; y: number }
  }): void {
    this.matchedSourceTraceId = sourceTraceId
    this._renderPcbBreakoutPoint({ layer: layer_ref.parse(layer) })
    this._setPositionFromLayout(position)
  }
}
