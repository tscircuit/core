import { resistorProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"
import { BASE_SYMBOLS, FTYPE, type PassivePorts } from "lib/utils/constants"
import { Port } from "./Port"

export class Resistor extends BaseComponent<
  typeof resistorProps,
  PassivePorts
> {
  get config() {
    return {
      schematicSymbolName: BASE_SYMBOLS.boxresistor,
      zodProps: resistorProps,
      sourceFtype: FTYPE.simple_resistor,
    }
  }

  pin1: Port = this.portMap.pin1
  pin2: Port = this.portMap.pin2

  initPorts() {
    this.add(new Port({ name: "pin1", aliases: ["1", "pin1", "left"] }))
    this.add(new Port({ name: "pin2", aliases: ["2", "pin2", "right"] }))
  }
}
