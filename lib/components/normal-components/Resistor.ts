import { resistorProps } from "@tscircuit/props"
import type { PassivePorts, Ftype, BaseSymbolName } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent"

export class Resistor extends NormalComponent<
  typeof resistorProps,
  PassivePorts
> {
  get config() {
    return {
      schematicSymbolName: "boxresistor" as BaseSymbolName,
      zodProps: resistorProps,
      sourceFtype: "simple_resistor" as Ftype,
    }
  }

  pin1 = this.portMap.pin1
  pin2 = this.portMap.pin2
}
