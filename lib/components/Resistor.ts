import { resistorProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"
import { BASE_SYMBOLS, FTYPE } from "lib/utils/constants"

export class Resistor extends BaseComponent<typeof resistorProps> {
  get config() {
    return {
      schematicSymbolName: BASE_SYMBOLS.boxresistor,
      zodProps: resistorProps,
      sourceFtype: FTYPE.simple_resistor,
    }
  }
}
