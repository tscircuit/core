import { BaseBreakoutPoint, baseBreakoutPointProps } from "./BaseBreakoutPoint"

/**
 * Internal-only breakout point that is created automatically by
 * `Breakout.doInitialCreateAutoplacedBreakoutPoints()` for ports whose
 * traces cross the breakout boundary. Unlike user-facing `BreakoutPoint`,
 * this class does NOT require a `connection` prop — its `matchedPort`
 * is set programmatically before rendering.
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

  doInitialPcbPrimitiveRender(): void {
    this._renderPcbBreakoutPoint()
  }
}
