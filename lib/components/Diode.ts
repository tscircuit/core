import { diodeProps } from "@tscircuit/props"
import { BaseComponent, type PortMap } from "./BaseComponent"
import { FTYPE, BASE_SYMBOLS, type TwoPinPorts } from "lib/utils/constants"
import { Port } from "./Port"

export class Diode extends BaseComponent<typeof diodeProps, TwoPinPorts> {
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
