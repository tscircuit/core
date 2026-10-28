import { differentialPairProps } from "@tscircuit/props"
import {
  type BaseComponentConfig,
  PrimitiveComponent,
} from "../base-components/PrimitiveComponent"
import { DifferentialPair_doInitialSourceDesignRuleChecks } from "./DifferentialPair_doInitialSourceDesignRuleChecks"

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

  doInitialSourceDesignRuleChecks(): void {
    DifferentialPair_doInitialSourceDesignRuleChecks(this)
  }
}
