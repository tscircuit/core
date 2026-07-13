import { differentialPairProps } from "@tscircuit/props"
import {
  type BaseComponentConfig,
  PrimitiveComponent,
} from "../base-components/PrimitiveComponent"

/**
 * Declares the routing constraints for a positive and negative trace pair.
 */
export class DifferentialPair extends PrimitiveComponent<
  typeof differentialPairProps
> {
  override get config(): BaseComponentConfig {
    return {
      componentName: "DifferentialPair",
      zodProps: differentialPairProps,
    }
  }
}
