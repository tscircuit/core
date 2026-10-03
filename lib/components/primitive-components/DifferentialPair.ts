import type { SourceBus } from "circuit-json"
import { resolveSourceBusRoutingConstraints } from "lib/utils/resolveSourceBusRoutingConstraints"
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
  source_bus_id?: SourceBus["source_bus_id"]

  doInitialSimulationRender(): void {
    resolveSourceBusRoutingConstraints(this)
  }

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
