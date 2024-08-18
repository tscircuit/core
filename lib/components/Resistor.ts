import { resistorProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"

export class Resistor extends BaseComponent<typeof resistorProps> {
  get config() {
    return {
      schematicSymbolName: "boxresistor",
      zodProps: resistorProps,

      sourceFtype: "simple_resistor",
    } as const
  }
}
