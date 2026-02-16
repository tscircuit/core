import { subcircuitProps } from "@tscircuit/props"
import type { z } from "zod"
import { inflateCircuitJson } from "../../../../utils/circuit-json/inflate-circuit-json"
import { Group } from "../Group"
import type { SubcircuitI } from "./SubcircuitI"
import { Subcircuit_doInitialRenderIsolatedSubcircuits } from "./Subcircuit_doInitialRenderIsolatedSubcircuits"
import { Subcircuit_getSubcircuitPropHash } from "../Subcircuit_getSubcircuitPropHash"

export class Subcircuit
  extends Group<typeof subcircuitProps>
  implements SubcircuitI
{
  constructor(props: z.input<typeof subcircuitProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  /**
   * Computes a hash of this subcircuit's props and children for caching.
   * Position/identity props are excluded so identical subcircuits at
   * different locations share the same hash.
   */
  getSubcircuitPropHash(): string {
    return Subcircuit_getSubcircuitPropHash(this)
  }

  /**
   * Render this subcircuit in isolation if _subcircuitCachingEnabled is set.
   * This phase runs before InflateSubcircuitCircuitJson to prepare the
   * isolated circuit JSON that will be inflated.
   *
   * The rendering is synchronous - it loops until all async effects in the
   * isolated circuit are complete, ensuring the cache is populated before
   * processing the next subcircuit with potentially the same props.
   */
  doInitialRenderIsolatedSubcircuits(): void {
    Subcircuit_doInitialRenderIsolatedSubcircuits(this)
  }

  /**
   * During this phase, we inflate the subcircuit circuit json into class
   * instances
   *
   * When subcircuit's define circuitJson, it's basically the same as having
   * a tree of components. All the data from circuit json has to be converted
   * into props for the tree of components
   *
   * We do this in two phases:
   * - Create the components
   * - Create the groups
   * - Add components to groups in the appropriate hierarchy
   */
  doInitialInflateSubcircuitCircuitJson() {
    const isolatedJson = this._isolatedCircuitJson
    if (isolatedJson) {
      this._isInflatedFromCircuitJson = true
      this._isolatedCircuitJson = null
      inflateCircuitJson(this, isolatedJson, [])
      return
    }

    const { circuitJson, children } = this._parsedProps
    if (circuitJson) {
      this._isInflatedFromCircuitJson = true
    }
    inflateCircuitJson(this, circuitJson, children)
  }
}
