import { resistorProps } from "@tscircuit/props"
import { BaseComponent, type BaseComponentConfig } from "./BaseComponent"

const resistorConfig: BaseComponentConfig = {
  schematicSymbolName: "boxresistor",
  propsZod: resistorProps,

  sourceFtype: "simple_resistor",
}

export class Resistor extends BaseComponent<typeof resistorProps> {
  get config() {
    return resistorConfig
  }
}
