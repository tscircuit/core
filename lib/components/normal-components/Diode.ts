import { diodeProps } from "@tscircuit/props"
import {
  FTYPE,
  SYMBOL,
  type Ftype,
  type TwoPinPorts,
} from "lib/utils/constants"
import { Port } from "../primitive-components/Port"
import { NormalComponent } from "../base-components/NormalComponent"

export class Diode extends NormalComponent<typeof diodeProps, TwoPinPorts> {
  pin1 = this.portMap.pin1
  pin2 = this.portMap.pin2

  get config() {
    return {
      // schematicSymbolName: "diode" as BaseSymbolName,
      zodProps: diodeProps,
      sourceFtype: "simple_diode" as Ftype,
    }
  }

  initPorts() {
    this.add(new Port({ name: "pin1", aliases: ["1", "pin1"] }))
    this.add(new Port({ name: "pin2", aliases: ["2", "pin2"] }))
  }
}
