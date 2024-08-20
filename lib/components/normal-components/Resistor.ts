import { resistorProps } from "@tscircuit/props"
import {
  PrimitiveComponent,
  type PortMap,
} from "../base-components/PrimitiveComponent"
import { BASE_SYMBOLS, FTYPE, type PassivePorts } from "lib/utils/constants"
import { Port } from "../primitive-components/Port"

export class Resistor extends PrimitiveComponent<
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
