import { diodeProps } from "@tscircuit/props"
import {
  PrimitiveComponent,
  type PortMap,
} from "../base-components/PrimitiveComponent"
import { FTYPE, BASE_SYMBOLS, type TwoPinPorts } from "lib/utils/constants"
import { Port } from "../primitive-components/Port"

export class Diode extends PrimitiveComponent<typeof diodeProps, TwoPinPorts> {
  pin1 = this.portMap.pin1
  pin2 = this.portMap.pin2

  get config() {
    return {
      // schematicSymbolName: BASE_SYMBOLS.diode,
      zodProps: diodeProps,
      sourceFtype: FTYPE.simple_diode,
    }
  }

  initPorts() {
    this.add(new Port({ name: "pin1", aliases: ["1", "pin1"] }))
    this.add(new Port({ name: "pin2", aliases: ["2", "pin2"] }))
  }
}
