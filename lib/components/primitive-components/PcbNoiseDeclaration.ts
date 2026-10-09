import type { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Parsed noise declarations belong to one container and never run a solver. */
export abstract class PcbNoiseDeclaration<
  ZodProps extends z.ZodType,
> extends PrimitiveComponent<ZodProps> {
  doInitialSimulationRender(): void {
    if (this.root?.pcbDisabled) return
    if (this.parent?.componentName !== "PcbNoiseSimulation") {
      this.renderError(
        "A PCB noise declaration must be directly inside a PCB noise simulation.",
      )
    }
    if (this.children.length) {
      this.renderError("A PCB noise declaration cannot contain children.")
    }
  }

  onPropsChange(): void {
    this._markDirty("SimulationRender")
  }

  updateSimulationRender(): void {
    this.doInitialSimulationRender()
  }
}
