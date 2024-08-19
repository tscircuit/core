import { ledProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"
import {
  FTYPE,
  BASE_SYMBOLS,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { Port } from "./Port"

export class Led extends BaseComponent<typeof ledProps, PolarizedPassivePorts> {
  get config() {
    return {
      schematicSymbolName: BASE_SYMBOLS.led,
      zodProps: ledProps,
      sourceFtype: FTYPE.simple_diode,
    }
  }

  pos = this.portMap.pin1
  pin1 = this.portMap.pin1
  anode = this.portMap.pin1
  neg = this.portMap.pin2
  pin2 = this.portMap.pin2
  cathode = this.portMap.pin2

  initPorts() {
    this.add(new Port({ name: "pos", pinNumber: 1, aliases: ["anode"] }))
    this.add(new Port({ name: "neg", pinNumber: 2, aliases: ["cathode"] }))
  }
}
