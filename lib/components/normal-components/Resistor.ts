import { resistorProps } from "@tscircuit/props"
import { BASE_SYMBOLS, FTYPE, type PassivePorts } from "lib/utils/constants"
import { Port } from "../primitive-components/Port"
import { NormalComponent } from "../base-components/NormalComponent"
import { z } from "zod"

export class Resistor extends NormalComponent<
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
