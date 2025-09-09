import { symbolProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class Symbol extends PrimitiveComponent<typeof symbolProps> {
  isSchematicPrimitive = true
  isPrimitiveContainer = true

  get config() {
    return {
      componentName: "Symbol",
      zodProps: symbolProps,
    }
  }
}
