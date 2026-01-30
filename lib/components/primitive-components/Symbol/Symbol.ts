import { symbolProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { Symbol_doInitialSchematicSymbolResize } from "./Symbol_doInitialSchematicSymbolResize"

export class SymbolComponent extends PrimitiveComponent<typeof symbolProps> {
  isPrimitiveContainer = true

  get config() {
    return {
      componentName: "Symbol",
      zodProps: symbolProps,
    }
  }

  doInitialSchematicSymbolResize(): void {
    Symbol_doInitialSchematicSymbolResize(this)
  }
}
