import { BaseBreakoutPoint, baseBreakoutPointProps } from "./BaseBreakoutPoint"

/**
 * Internal-only breakout point that is created automatically by
 * `Breakout.doInitialCreateAutoplacedBreakoutPoints()` for ports whose
 * traces cross the breakout boundary. Unlike user-facing `BreakoutPoint`,
 * this class does NOT require a `connection` prop — its `matchedPort`
 * is set programmatically before rendering.
 *
 * Position is deferred: `doInitialPcbPrimitiveRender` is a no-op because
 * the position is unknown until the solver runs in the parent Breakout's
 * `doInitialPcbAutoBreakoutPointRender` phase, which calls
 * `_renderPcbBreakoutPointAtPosition` directly on each child.
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
    // No-op: position is unknown at this phase. The parent Breakout
    // creates the db record via _renderPcbBreakoutPointAtPosition
    // during PcbAutoBreakoutPointRender after running the solver.
  }
}
