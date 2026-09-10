import type { LayerRef } from "circuit-json"
import { BreakoutPoint } from "../BreakoutPoint"

/** An explicit exit whose physical board layer is stored with its route. */
export class SavedFanoutPoint extends BreakoutPoint {
  exitLayer: LayerRef = "top"

  doInitialPcbPrimitiveRender(): void {
    this._matchConnection()
    this._renderPcbBreakoutPoint({ layer: this.exitLayer })
  }
}
