import { resistorProps } from "@tscircuit/props"
import { BaseComponent, type PortMap } from "./BaseComponent"
import { BASE_SYMBOLS, FTYPE, type PassivePorts } from "lib/utils/constants"
import { Port } from "./Port"

export class Resistor extends BaseComponent<
  typeof resistorProps,
  PassivePorts
> {
  pin1: Port = this.portMap.pin1
  pin2: Port = this.portMap.pin2

  get config() {
    return {
      schematicSymbolName: BASE_SYMBOLS.boxresistor,
      zodProps: resistorProps,
      sourceFtype: FTYPE.simple_resistor,
    }
  }

  initPorts() {
    this.add(new Port({ name: "pin1", pinNumber: 1 }))
    this.add(new Port({ name: "pin2", pinNumber: 2 }))
  }
}
