import { differentialPairProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/**
 * Declares the routing constraints for a positive and negative trace pair.
 */
export class DifferentialPair extends PrimitiveComponent<
  typeof differentialPairProps
> {
  get config() {
    return {
      componentName: "DifferentialPair",
      zodProps: differentialPairProps,
    }
  }
}
