import { BaseBreakoutPoint, baseBreakoutPointProps } from "./BaseBreakoutPoint"

/**
 * Internal-only breakout point that is created automatically by
 * `Breakout.doInitialCreateAutoplacedBreakoutPoints()` for ports whose
 * traces cross the breakout boundary. Unlike user-facing `BreakoutPoint`,
 * this class does NOT require a `connection` prop — its `matchedPort`
 * is set programmatically. It renders only after the topology solver returns
 * a real boundary position, so an unused candidate cannot create a phantom
 * breakout point at the origin.
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
    position,
  }: {
    sourceTraceId: string
    position: { x: number; y: number }
  }): void {
    this.matchedSourceTraceId = sourceTraceId
    this._renderPcbBreakoutPoint()
    this._setPositionFromLayout(position)
  }
}
