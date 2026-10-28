import { differentialPairProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { type BaseComponentConfig } from "../base-components/PrimitiveComponent/base-component-config"
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
