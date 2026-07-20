import { internalCircuitProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class InternalCircuit extends PrimitiveComponent<
  typeof internalCircuitProps
> {
  get config() {
    return {
      componentName: "InternalCircuit",
      zodProps: internalCircuitProps,
    }
  }
}
