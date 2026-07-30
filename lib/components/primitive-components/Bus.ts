import { busProps } from "@tscircuit/props"
import {
  type BaseComponentConfig,
  PrimitiveComponent,
} from "../base-components/PrimitiveComponent"

/**
 * Declares a group of connections that an autorouter should keep together.
 */
export class Bus extends PrimitiveComponent<typeof busProps> {
  override get config(): BaseComponentConfig {
    return {
      componentName: "Bus",
      zodProps: busProps,
    }
  }
}
