import { differentialPairProps } from "@tscircuit/props"
import {
  type BaseComponentConfig,
  PrimitiveComponent,
} from "../base-components/PrimitiveComponent"
import {
  DifferentialPair_doInitialSourceDesignRuleChecks,
  DifferentialPair_removeSourceDesignRuleChecks,
} from "./DifferentialPair_doInitialSourceDesignRuleChecks"

/**
 * Declares the routing constraints for a positive and negative trace pair.
 */
export class DifferentialPair extends PrimitiveComponent<
  typeof differentialPairProps
> {
  _pointToPointWarningIds: string[] = []

  override get config(): BaseComponentConfig {
    return {
      componentName: "DifferentialPair",
      zodProps: differentialPairProps,
    }
  }

  doInitialSourceDesignRuleChecks(): void {
    DifferentialPair_doInitialSourceDesignRuleChecks(this)
  }

  updateSourceDesignRuleChecks(): void {
    DifferentialPair_doInitialSourceDesignRuleChecks(this)
  }

  removeSourceDesignRuleChecks(): void {
    DifferentialPair_removeSourceDesignRuleChecks(this)
  }
}
