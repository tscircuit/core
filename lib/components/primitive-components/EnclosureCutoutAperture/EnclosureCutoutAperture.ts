import type { EnclosureApertureInput } from "@tscircuit/create-fdm-enclosure"
import { enclosureCutoutApertureProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import {
  type GetFdmEnclosureSolverInputParams,
  getFdmEnclosureSolverInput,
} from "./get-fdm-enclosure-solver-input"

/**
 * Metadata consumed by enclosure generators. The aperture itself does not emit
 * Circuit JSON; its nearest ancestor with a pcb_component determines where the
 * enclosure opening is placed.
 */
export class EnclosureCutoutAperture extends PrimitiveComponent<
  typeof enclosureCutoutApertureProps
> {
  /**
   * No Circuit JSON record of its own, so it cannot survive being round-tripped
   * through one. Subcircuit isolation checks this and declines to isolate a
   * subtree containing it, rather than dropping it silently.
   */
  isEphemeralDeclaration = true as const

  get config() {
    return {
      componentName: "EnclosureCutoutAperture",
      zodProps: enclosureCutoutApertureProps,
    }
  }

  getFdmEnclosureSolverInput(
    params: GetFdmEnclosureSolverInputParams,
  ): EnclosureApertureInput {
    return getFdmEnclosureSolverInput(this, params)
  }
}
