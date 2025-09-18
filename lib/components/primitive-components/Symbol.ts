import { symbolProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SymbolComponent extends PrimitiveComponent<typeof symbolProps> {
  isPrimitiveContainer = true

  get config() {
    return {
      componentName: "Symbol",
      zodProps: symbolProps,
    }
  }
}
